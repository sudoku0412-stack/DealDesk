import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/admin-auth";
import { APP_NAME } from "@/lib/config";
import { Logo } from "@/components/nav";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const configured = adminConfigured();

  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4">
      <div className="glass w-full max-w-sm rounded-3xl p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold">{APP_NAME} admin</h1>

        {!configured ? (
          <p role="alert" className="mt-4 rounded-xl border border-line bg-surface-solid p-3 text-sm text-muted">
            Admin is not configured. Set <code className="font-mono">ADMIN_PASSWORD</code> (12+ characters) and redeploy.
          </p>
        ) : (
          <form method="post" action="/api/admin/login" className="mt-6 space-y-3">
            <label htmlFor="password" className="text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-12 w-full rounded-xl border border-line bg-surface-solid px-4 text-base"
            />
            <p role="alert" className="min-h-5 text-sm font-medium text-[#c0270a] dark:text-[#ff9a7a]">
              {error === "rate" ? "Too many attempts. Try again later." : error ? "Incorrect password." : ""}
            </p>
            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-accent font-display font-bold text-accent-ink transition hover:brightness-105 active:scale-[0.98]"
            >
              Sign in
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
