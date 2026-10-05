import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, checkPassword, createSessionValue, sessionCookieOptions } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function redirect(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, req.url), 303);
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
  if (!rateLimit(`admin-login:${ip}`, 8, 15 * 60 * 1000).ok) return redirect(req, "/admin/login?error=rate");

  const form = await req.formData().catch(() => null);
  const password = String(form?.get("password") ?? "");

  if (!(await checkPassword(password))) return redirect(req, "/admin/login?error=1");

  const res = redirect(req, "/admin");
  res.cookies.set(ADMIN_COOKIE, await createSessionValue(), sessionCookieOptions);
  return res;
}
