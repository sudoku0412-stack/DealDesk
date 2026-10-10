"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

type State = { status: "idle" | "loading" | "sent" } | { status: "error"; message: string; notInvited?: boolean };

export function LoginForm({ google = false }: { google?: boolean }) {
  const id = useId();
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; code?: string } | null;
      if (res.ok && body?.ok) return setState({ status: "sent" });
      setState({ status: "error", message: body?.error ?? "Something went wrong.", notInvited: body?.code === "not_invited" });
    } catch {
      setState({ status: "error", message: "Network error. Try again." });
    }
  }

  async function signInWithGoogle() {
    setState({ status: "loading" });
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setState({ status: "error", message: "Could not start Google sign-in. Try again." });
  }

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface-solid p-5">
        <p className="font-display text-xl font-bold">Check your inbox</p>
        <p className="mt-1 text-sm text-muted">We sent a sign-in link. Open it in this same browser. It expires in an hour.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {google && (
        <>
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={state.status === "loading"}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface-solid font-display font-bold transition hover:bg-surface active:scale-[0.98] disabled:opacity-70"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.5 7l7.3 5.7c4.3-4 6.9-9.8 6.9-17.2z" />
              <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.7 2.3-8.6 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Continue with Google
          </button>
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted">or</p>
        </>
      )}
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor={`${id}-email`} className="text-sm font-semibold">
        Email
      </label>
      <input
        id={`${id}-email`}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@channel.com"
        className="h-12 w-full rounded-xl border border-line bg-surface-solid px-4 text-base"
      />
      <p role="alert" className="min-h-5 text-sm font-medium text-[#c0270a] dark:text-[#ff9a7a]">
        {state.status === "error" && (
          <>
            {state.message}{" "}
            {state.notInvited && (
              <Link href="/#waitlist" className="underline">
                Join the waitlist
              </Link>
            )}
          </>
        )}
      </p>
      <button
        type="submit"
        disabled={state.status === "loading"}
        className="h-12 w-full rounded-xl bg-accent font-display font-bold text-accent-ink transition hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
      >
        {state.status === "loading" ? "Sending…" : "Email me a magic link"}
      </button>
    </form>
    </div>
  );
}
