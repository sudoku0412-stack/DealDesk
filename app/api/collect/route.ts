import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|uptime|curl|wget|python|node-fetch|go-http/i;

async function dailyVisitorHash(ip: string, ua: string) {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dealdesk";
  const day = new Date().toISOString().slice(0, 10);
  const data = new TextEncoder().encode(`${salt}|${day}|${ip}|${ua}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Reduce a referrer URL (or utm_source) to a short, safe label. */
function referrerLabel(raw: unknown, ownHost: string) {
  if (typeof raw !== "string" || !raw) return null;
  let label = raw.trim().slice(0, 200);
  try {
    label = new URL(label).hostname;
  } catch {
    /* not a URL: treat as a utm_source label */
  }
  label = label.toLowerCase().replace(/^www\./, "").slice(0, 60);
  return !label || label === ownHost.replace(/^www\./, "") ? null : label;
}

const done = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return done();

  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("cf-connecting-ip") ?? "unknown").trim();
  if (!rateLimit(`collect:${ip}`, 60, 60 * 1000).ok) return done();
  if (await isAdmin()) return done(); // don't count your own visits

  const body = (await req.json().catch(() => null)) as { path?: unknown; ref?: unknown } | null;
  const path = typeof body?.path === "string" ? body.path.slice(0, 200) : "";
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return done();

  const supabase = getSupabase();
  if (!supabase) return done();

  const { error } = await supabase.from("page_views").insert({
    visitor: await dailyVisitorHash(ip, ua),
    path,
    referrer: referrerLabel(body?.ref, req.nextUrl.hostname),
    country: req.headers.get("cf-ipcountry")?.slice(0, 2) || null,
  });
  if (error) console.error("[collect] insert failed:", error.message);

  return done();
}
