"use client";

import { useId, useState } from "react";
import Link from "next/link";

type State = { status: "idle" | "loading" | "sent" } | { status: "error"; message: string; notInvited?: boolean };

export function LoginForm() {
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

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface-solid p-5">
        <p className="font-display text-xl font-bold">Check your inbox</p>
        <p className="mt-1 text-sm text-muted">We sent a sign-in link. Open it in this same browser. It expires in an hour.</p>
      </div>
    );
  }

  return (
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
  );
}
