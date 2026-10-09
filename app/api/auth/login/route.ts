import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient, authConfigured } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address.")) });
const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Sends a magic link. While SIGNUP_MODE is "waitlist" (default), only people on the waitlist
 * and existing users can sign in. Set SIGNUP_MODE=open to allow anyone.
 */
export async function POST(req: NextRequest) {
  if (!authConfigured()) return json({ ok: false, error: "Sign-in is not configured yet." }, 503);

  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
  if (!rateLimit(`login:${ip}`, 6, 10 * 60 * 1000).ok) return json({ ok: false, error: "Too many attempts. Try again in a few minutes." }, 429);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email." }, 400);
  const { email } = parsed.data;

  if (!rateLimit(`login-email:${email}`, 3, 10 * 60 * 1000).ok) return json({ ok: false, error: "A link was just sent. Check your inbox." }, 429);

  if ((process.env.SIGNUP_MODE ?? "waitlist") !== "open") {
    const admin = getSupabase();
    if (!admin) return json({ ok: false, error: "Sign-in is temporarily unavailable." }, 503);
    const [onList, existing] = await Promise.all([
      admin.from("waitlist").select("id", { head: true, count: "exact" }).eq("email", email),
      admin.from("profiles").select("id", { head: true, count: "exact" }).eq("email", email),
    ]);
    if (!onList.count && !existing.count) {
      return json({ ok: false, code: "not_invited", error: "DealDesk is invite-only for now. Join the waitlist and you'll get access." }, 403);
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback`, shouldCreateUser: true },
  });
  if (error) {
    console.error("[auth] signInWithOtp failed:", error.message);
    return json({ ok: false, error: "Could not send the sign-in link. Please try again." }, 500);
  }
  return json({ ok: true });
}
