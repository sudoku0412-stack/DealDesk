import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authConfigured, createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/nav";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (authConfigured()) {
    const {
      data: { user },
    } = await (await createClient()).auth.getUser();
    if (user) redirect("/app");
  }

  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold">Sign in</h1>
        <p className="mt-2 text-muted">We&apos;ll email you a magic link. No password needed.</p>
        {error === "link" && (
          <p role="alert" className="mt-4 rounded-xl border border-line bg-surface-solid p-3 text-sm text-[#c0270a] dark:text-[#ff9a7a]">
            That sign-in link expired or was opened in a different browser. Request a new one below.
          </p>
        )}
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
