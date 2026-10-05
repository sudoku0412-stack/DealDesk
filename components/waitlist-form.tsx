"use client";

import { useId, useState } from "react";
import { EARLY_ACCESS_OFFER, PLATFORMS } from "@/lib/config";
import { trackEvent } from "@/lib/analytics";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; position: number; duplicate: boolean }
  | { status: "error"; message: string };

type Props = {
  /** Where the form sits, sent with the analytics event. */
  source: "hero" | "final-cta";
  tone?: "default" | "inverted";
};

export function WaitlistForm({ source, tone = "default" }: Props) {
  const uid = useId();
  const [state, setState] = useState<State>({ status: "idle" });
  const inverted = tone === "inverted";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.status === "loading") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    const platform = String(data.get("platform") ?? "");

    setState({ status: "loading" });

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          platform,
          company: data.get("company"),
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | { ok: true; position: number; duplicate: boolean }
        | { ok: false; error?: string }
        | null;

      if (res.ok && body?.ok) {
        trackEvent("waitlist_signup", { source, platform, duplicate: body.duplicate });
        setState({ status: "success", position: body.position, duplicate: body.duplicate });
        form.reset();
        return;
      }

      setState({
        status: "error",
        message: (body && !body.ok && body.error) || "Something went wrong. Please try again.",
      });
    } catch {
      setState({ status: "error", message: "Network error. Check your connection and try again." });
    }
  }

  const field =
    "h-12 w-full rounded-xl border px-4 text-base outline-offset-2 transition placeholder:text-muted focus:border-accent " +
    (inverted ? "border-white/20 bg-white/10 text-white placeholder:text-white/60" : "border-line bg-surface-solid text-fg");

  if (state.status === "success") {
    return (
      <div
        role="status"
        className={`mx-auto w-full max-w-xl rounded-2xl border p-5 text-left ${
          inverted ? "border-white/20 bg-white/10 text-white" : "border-line bg-surface-solid text-fg"
        }`}
      >
        <p className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid size-7 place-items-center rounded-full bg-green text-accent-ink" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </span>
          {state.duplicate ? `You're already in. You're #${state.position}.` : `You're #${state.position} on the list.`}
        </p>
        <p className={`mt-2 text-sm ${inverted ? "text-white/75" : "text-muted"}`}>
          {state.duplicate
            ? "No need to sign up twice. Your spot and your early-access perk are safe."
            : `Check your inbox for a confirmation. Your spot locks in ${EARLY_ACCESS_OFFER}.`}
        </p>
      </div>
    );
  }

  const loading = state.status === "loading";
  const errorId = `${uid}-error`;

  return (
    <form onSubmit={onSubmit} noValidate={false} className="mx-auto w-full max-w-xl" aria-busy={loading}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor={`${uid}-email`} className="sr-only">
            Email address
          </label>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@channel.com"
            aria-describedby={state.status === "error" ? errorId : undefined}
            className={field}
          />
        </div>
        <div className="sm:w-40">
          <label htmlFor={`${uid}-platform`} className="sr-only">
            Main platform
          </label>
          <select
            id={`${uid}-platform`}
            name="platform"
            required
            defaultValue=""
            className={`${field} appearance-none bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23898f9c' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            }}
          >
            <option value="" disabled>
              Platform
            </option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p} className="text-[#15171e]">
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 font-display text-base font-bold text-accent-ink shadow-[0_8px_24px_-8px_var(--accent)] transition hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "Saving your spot…" : `Get early access, ${EARLY_ACCESS_OFFER}`}
        {!loading && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        )}
      </button>

      <p
        id={errorId}
        role="alert"
        className={`mt-3 min-h-5 text-sm font-medium ${inverted ? "text-[#ffb59a]" : "text-[#c0270a] dark:text-[#ff9a7a]"}`}
      >
        {state.status === "error" ? state.message : ""}
      </p>
      <p className={`text-xs ${inverted ? "text-white/65" : "text-muted"}`}>
        Free for your first 3 active deals. No spam, one email when your invite is ready.
      </p>
    </form>
  );
}
