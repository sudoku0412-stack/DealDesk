"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { DealTemplate, Profile } from "@/lib/app/types";
import { btnGhost, btnPrimary, inputClass, Pill } from "@/components/app/pill";

const CURRENCIES = ["USD", "CAD", "EUR", "GBP", "AUD", "INR"];

const ZONES = [
  "UTC", "America/St_Johns", "America/Halifax", "America/Toronto", "America/Winnipeg", "America/Edmonton", "America/Vancouver",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu",
  "America/Mexico_City", "America/Sao_Paulo", "America/Argentina/Buenos_Aires", "Europe/London", "Europe/Dublin", "Europe/Paris",
  "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Amsterdam", "Europe/Stockholm", "Europe/Athens", "Europe/Istanbul",
  "Africa/Lagos", "Africa/Johannesburg", "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Dhaka", "Asia/Bangkok", "Asia/Singapore",
  "Asia/Hong_Kong", "Asia/Shanghai", "Asia/Tokyo", "Asia/Seoul", "Australia/Perth", "Australia/Sydney", "Pacific/Auckland",
];

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? "AM" : "PM"}`;

type Props = { profile: Profile; templates: DealTemplate[]; billingEnabled: boolean; billingResult?: string };

export function SettingsForm({ profile, templates: initialTemplates, billingEnabled, billingResult }: Props) {
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [zone, setZone] = useState(profile.timezone);
  const [templates, setTemplates] = useState(initialTemplates);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  // Offer the browser's time zone when the account is still on the UTC default.
  const [detected, setDetected] = useState<string | null>(null);
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz !== zone) setDetected(tz);
    } catch {
      /* ignore */
    }
  }, [zone]);

  const zoneOptions = Array.from(new Set([zone, ...(detected ? [detected] : []), ...ZONES]));

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const { error } = await supabaseBrowser()
      .from("profiles")
      .update({
        display_name: String(f.get("name") || "").trim() || null,
        currency: String(f.get("currency")),
        timezone: zone,
        reminder_hour: Number(f.get("hour")),
        reminder_lead_days: Number(f.get("lead")),
        reminders_enabled: f.get("reminders") === "on",
      })
      .eq("id", profile.id);
    setStatus(error ? { ok: false, text: "Could not save. Try again." } : { ok: true, text: "Saved." });
  }

  async function removeTemplate(id: string) {
    const { error } = await supabaseBrowser().from("deal_templates").delete().eq("id", id);
    if (!error) setTemplates((all) => all.filter((t) => t.id !== id));
  }

  async function billing(path: "checkout" | "portal") {
    setBillingBusy(true);
    setBillingError(null);
    try {
      const res = await fetch(`/api/billing/${path}`, { method: "POST" });
      const body = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (res.ok && body?.url) return void (window.location.href = body.url);
      setBillingError(body?.error ?? "Could not open billing. Try again.");
    } catch {
      setBillingError("Network error. Try again.");
    }
    setBillingBusy(false);
  }

  const isPro = profile.plan === "pro";

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
        <label className="block text-sm font-semibold">
          Time zone
          <select value={zone} onChange={(e) => setZone(e.target.value)} className={`${inputClass} mt-1 font-normal`}>
            {zoneOptions.map((z) => (<option key={z} value={z}>{z.replace(/_/g, " ")}</option>))}
          </select>
        </label>
        {detected && (
          <p className="-mt-2 text-xs text-muted">
            Your browser says {detected.replace(/_/g, " ")}.{" "}
            <button type="button" onClick={() => setZone(detected)} className="font-semibold text-fg underline underline-offset-4">Use it</button>
          </p>
        )}

        <fieldset className="space-y-3 rounded-xl border border-line p-4">
          <legend className="px-1 text-sm font-semibold">Reminder emails</legend>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name="reminders" defaultChecked={profile.reminders_enabled} className="size-5 accent-[var(--accent)]" />
            Send me a daily digest of deadlines and late payments
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              Send at
              <select name="hour" defaultValue={profile.reminder_hour} className={`${inputClass} mt-1 font-normal`}>
                {Array.from({ length: 24 }, (_, h) => (<option key={h} value={h}>{hourLabel(h)}</option>))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Warn me
              <select name="lead" defaultValue={profile.reminder_lead_days} className={`${inputClass} mt-1 font-normal`}>
                {[0, 1, 2, 3, 5, 7].map((d) => (<option key={d} value={d}>{d === 0 ? "On the due date" : `${d} day${d > 1 ? "s" : ""} before`}</option>))}
              </select>
            </label>
          </div>
          <p className="text-xs text-muted">Sent once a day at your chosen time in your time zone, and only when there is something to report.</p>
        </fieldset>

        <p role="status" className={`min-h-5 text-sm font-semibold ${status?.ok ? "text-green-text" : "text-[#c0270a] dark:text-[#ff9a7a]"}`}>{status?.text}</p>
        <button className={btnPrimary}>Save settings</button>
      </form>

      <section className="glass rounded-2xl p-5" aria-labelledby="plan-title">
        <h2 id="plan-title" className="font-display text-lg font-bold">
          Plan <Pill tone={isPro ? "ok" : "accent"}>{isPro ? "Pro" : "Free"}</Pill>
        </h2>
        {billingResult === "success" && <p role="status" className="mt-2 text-sm font-semibold text-green-text">Thanks! Your Pro plan is being activated. Refresh in a moment if it still says Free.</p>}
        {billingResult === "cancelled" && <p className="mt-2 text-sm text-muted">Checkout cancelled. You have not been charged.</p>}
        <p className="mt-2 text-sm text-muted">
          {isPro
            ? `Unlimited active deals.${profile.plan_period_end ? ` Renews or ends ${new Date(profile.plan_period_end).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "UTC" })}.` : ""}`
            : "Free covers 3 active deals at a time. Pro removes the limit, and early-access members get 50% off for life."}
        </p>
        {billingEnabled ? (
          <div className="mt-3">
            <button className={isPro ? btnGhost : btnPrimary} disabled={billingBusy} onClick={() => billing(isPro ? "portal" : "checkout")}>
              {billingBusy ? "Opening…" : isPro ? "Manage billing" : "Upgrade to Pro"}
            </button>
            <p role="alert" className="mt-2 min-h-5 text-sm font-medium text-[#c0270a] dark:text-[#ff9a7a]">{billingError}</p>
          </div>
        ) : (
          !isPro && <p className="mt-2 text-sm text-muted">Pro is coming soon.</p>
        )}
      </section>

      <section className="glass rounded-2xl p-5" aria-labelledby="templates-title">
        <h2 id="templates-title" className="font-display text-lg font-bold">Your deal templates</h2>
        <p className="mt-1 text-sm text-muted">Create one from any deal with &quot;Save as template&quot;. Pick it when you add a deal.</p>
        <ul className="mt-3 divide-y divide-line/60">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-semibold">{t.name}</span>
                <span className="text-xs text-muted">{t.deliverables.length} deliverables · {t.payments.length} payments</span>
              </span>
              <button onClick={() => removeTemplate(t.id)} aria-label={`Delete template ${t.name}`} className="text-xs font-semibold underline underline-offset-4">Delete</button>
            </li>
          ))}
          {templates.length === 0 && <li className="py-3 text-sm text-muted">No templates yet.</li>}
        </ul>
      </section>

      <section className="glass rounded-2xl p-5" aria-labelledby="data-title">
        <h2 id="data-title" className="font-display text-lg font-bold">Your data</h2>
        <p className="mt-1 text-sm text-muted">Download everything as spreadsheets (CSV).</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/api/export/deals" className={btnGhost}>Export deals</a>
          <a href="/api/export/payments" className={btnGhost}>Export payments</a>
        </div>
      </section>

      <form method="post" action="/auth/signout">
        <button className="h-11 rounded-xl border border-line px-5 text-sm font-semibold hover:bg-surface">Sign out</button>
      </form>
    </div>
  );
}
