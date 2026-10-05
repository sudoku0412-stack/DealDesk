import { NextResponse, type NextRequest } from "next/server";
import { waitlistSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase";
import { sendWaitlistConfirmation } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNIQUE_VIOLATION = "23505";

function clientIp(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

function json(body: Record<string, unknown>, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(`waitlist:${clientIp(req)}`);
  if (!limited.ok) {
    return json(
      { ok: false, error: "Too many attempts. Please try again in a few minutes." },
      429,
      { "Retry-After": String(limited.retryAfterSeconds) },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const parsed = waitlistSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, 400);
  }

  const { email, platform, company } = parsed.data;

  // Honeypot filled in: pretend success so bots learn nothing, store nothing.
  if (company.trim() !== "") {
    return json({ ok: true, position: 1, duplicate: false });
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error("[waitlist] Supabase env vars are not configured.");
    return json({ ok: false, error: "The waitlist is temporarily unavailable. Please try again soon." }, 503);
  }

  const { data: row, error } = await supabase
    .from("waitlist")
    .insert({ email, platform })
    .select("created_at")
    .single();

  let createdAt: string | undefined = row?.created_at;
  let duplicate = false;

  if (error) {
    if (error.code !== UNIQUE_VIOLATION) {
      console.error("[waitlist] insert failed:", error.message);
      return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
    }
    duplicate = true;
    const existing = await supabase.from("waitlist").select("created_at").eq("email", email).single();
    createdAt = existing.data?.created_at;
  }

  if (!createdAt) {
    return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }

  const { count, error: countError } = await supabase
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .lte("created_at", createdAt);

  if (countError || count === null) {
    console.error("[waitlist] position lookup failed:", countError?.message);
    return json({ ok: false, error: "Something went wrong. Please try again." }, 500);
  }

  if (!duplicate) {
    // Best-effort: a failed email must never fail the signup.
    await sendWaitlistConfirmation(email, count);
  }

  return json({ ok: true, position: count, duplicate });
}
