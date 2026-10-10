import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next");
  const dest = next && next.startsWith("/app") ? next : "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (!(await isAllowed(supabase))) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login?error=invited", SITE_URL));
      }
      return NextResponse.redirect(new URL(dest, SITE_URL));
    }
    console.error("[auth] code exchange failed:", error.message);
  }
  return NextResponse.redirect(new URL("/login?error=link", SITE_URL));
}

/**
 * While SIGNUP_MODE is "waitlist" (default), a brand-new account (for example from "Continue with Google")
 * is only kept if its email is on the waitlist. Otherwise the just-created user is deleted.
 */
async function isAllowed(supabase: Awaited<ReturnType<typeof createClient>>) {
  if ((process.env.SIGNUP_MODE ?? "waitlist") === "open") return true;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase();
  const admin = getSupabase();
  if (!user || !email || !admin) return false;

  const [{ count }, { data: profile }] = await Promise.all([
    admin.from("waitlist").select("id", { head: true, count: "exact" }).eq("email", email),
    admin.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
  ]);
  if (count) return true;

  const isNew = !profile || Date.now() - new Date(profile.created_at).getTime() < 2 * 60 * 1000;
  if (!isNew) return true; // an existing member signing in another way
  await admin.auth.admin.deleteUser(user.id);
  return false;
}
