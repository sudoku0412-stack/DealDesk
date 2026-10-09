"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Profile } from "@/lib/app/types";
import { btnPrimary, inputClass, Pill } from "@/components/app/pill";

const CURRENCIES = ["USD", "CAD", "EUR", "GBP", "AUD", "INR"];

export function SettingsForm({ profile }: { profile: Profile }) {
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { error } = await supabaseBrowser()
      .from("profiles")
      .update({
        display_name: String(f.get("name") || "").trim() || null,
        currency: String(f.get("currency")),
        reminders_enabled: f.get("reminders") === "on",
      })
      .eq("id", profile.id);
    setStatus(error ? { ok: false, text: "Could not save. Try again." } : { ok: true, text: "Saved." });
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-3xl font-extrabold">Settings</h1>

      <form onSubmit={save} className="glass space-y-4 rounded-2xl p-5">
        <p className="text-sm text-muted">Signed in as <strong className="text-fg">{profile.email}</strong></p>
        <label className="block text-sm font-semibold">
          Display name
          <input name="name" defaultValue={profile.display_name ?? ""} maxLength={80} placeholder="Shown on your rate card" className={`${inputClass} mt-1 font-normal`} />
        </label>
        <label className="block text-sm font-semibold">
          Currency
          <select name="currency" defaultValue={profile.currency} className={`${inputClass} mt-1 font-normal`}>
            {CURRENCIES.map((c) => (<option key={c}>{c}</option>))}
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="reminders" defaultChecked={profile.reminders_enabled} className="size-5 accent-[var(--accent)]" />
          Email me deadline and overdue-payment reminders (daily digest)
        </label>
        <p role="status" className={`min-h-5 text-sm font-semibold ${status?.ok ? "text-green-text" : "text-[#c0270a] dark:text-[#ff9a7a]"}`}>{status?.text}</p>
        <button className={btnPrimary}>Save settings</button>
      </form>

      <section className="glass rounded-2xl p-5">
        <h2 className="font-display text-lg font-bold">Plan <Pill tone={profile.plan === "pro" ? "ok" : "accent"}>{profile.plan === "pro" ? "Pro" : "Free"}</Pill></h2>
        <p className="mt-2 text-sm text-muted">
          {profile.plan === "pro" ? "Unlimited active deals." : "Free covers 3 active deals at a time. Pro (unlimited deals) is coming soon, and early-access members get 50% off for life."}
        </p>
      </section>

      <form method="post" action="/auth/signout">
        <button className="h-11 rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface">Sign out</button>
      </form>
    </div>
  );
}
