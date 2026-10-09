"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { parseMoney } from "@/lib/app/format";
import type { Profile, RateItem } from "@/lib/app/types";
import { btnGhost, btnPrimary, inputClass } from "@/components/app/pill";

export function RateCardEditor({ initialItems, profile, siteUrl }: { initialItems: RateItem[]; profile: Profile; siteUrl: string }) {
  const db = supabaseBrowser();
  const [items, setItems] = useState(initialItems);
  const [isPublic, setIsPublic] = useState(profile.rate_card_public);
  const [intro, setIntro] = useState(profile.rate_card_intro ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const link = `${siteUrl}/r/${profile.public_slug}`;

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const price = parseMoney(String(f.get("price") || ""));
    if (price === null) return setMsg("Enter a valid price.");
    const { data, error } = await db
      .from("rate_card_items")
      .insert({ label: String(f.get("label")).trim(), description: String(f.get("description") || "").trim() || null, price_cents: price, sort: items.length })
      .select("id,label,description,price_cents,sort")
      .single();
    if (error || !data) return setMsg("Could not add. Try again.");
    setItems((i) => [...i, data as RateItem]);
    setMsg(null);
    form.reset();
  }

  async function save(item: RateItem, patch: Partial<RateItem>) {
    const { error } = await db.from("rate_card_items").update(patch).eq("id", item.id);
    if (error) return setMsg("Could not save. Try again.");
    setItems((all) => all.map((x) => (x.id === item.id ? { ...x, ...patch } : x)));
    setMsg(null);
  }

  async function remove(id: string) {
    const { error } = await db.from("rate_card_items").delete().eq("id", id);
    if (error) return setMsg("Could not delete.");
    setItems((all) => all.filter((x) => x.id !== id));
  }

  async function saveProfile(patch: Partial<Pick<Profile, "rate_card_public" | "rate_card_intro">>) {
    const { error } = await db.from("profiles").update(patch).eq("id", profile.id);
    if (error) setMsg("Could not save settings.");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Rate card</h1>
        <p className="mt-1 text-muted">Your prices per format. Share a link so brands stop guessing.</p>
      </div>
      <p role="status" className="min-h-5 text-sm font-semibold text-[#c0270a] dark:text-[#ff9a7a]">{msg}</p>

      <section className="glass space-y-3 rounded-2xl p-5" aria-labelledby="share-title">
        <h2 id="share-title" className="font-display text-lg font-bold">Sharing</h2>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => {
              setIsPublic(e.target.checked);
              saveProfile({ rate_card_public: e.target.checked });
            }}
            className="size-5 accent-[var(--accent)]"
          />
          Make my rate card public
        </label>
        <p className="text-xs text-muted">Anyone with the link sees your name, these rates and your account email. It is hidden from search engines.</p>
        {isPublic && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input readOnly value={link} aria-label="Public link" className={inputClass} onFocus={(e) => e.currentTarget.select()} />
            <button
              className={btnGhost}
              onClick={async () => {
                await navigator.clipboard.writeText(link).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        )}
        <label className="block text-sm font-semibold">
          Intro shown above your rates
          <textarea value={intro} onChange={(e) => setIntro(e.target.value)} onBlur={() => saveProfile({ rate_card_intro: intro.trim() || null })} rows={2} maxLength={400} placeholder="Tech reviews for 120k subscribers. Rates are per deliverable." className={`${inputClass} mt-1 h-auto py-2 font-normal`} />
        </label>
      </section>

      <section className="glass rounded-2xl p-5" aria-labelledby="rates-title">
        <h2 id="rates-title" className="font-display text-lg font-bold">Rates ({profile.currency})</h2>
        <ul className="mt-3 space-y-3">
          {items.map((i) => (
            <li key={i.id} className="grid gap-2 rounded-xl border border-line bg-surface-solid p-3 sm:grid-cols-[1fr_1fr_8rem_auto]">
              <input defaultValue={i.label} aria-label="Format" maxLength={120} onBlur={(e) => e.target.value.trim() && e.target.value !== i.label && save(i, { label: e.target.value.trim() })} className={inputClass} />
              <input defaultValue={i.description ?? ""} aria-label="Description" maxLength={300} placeholder="Description (optional)" onBlur={(e) => e.target.value !== (i.description ?? "") && save(i, { description: e.target.value.trim() || null })} className={inputClass} />
              <input defaultValue={(i.price_cents / 100).toString()} aria-label={`Price for ${i.label}`} inputMode="decimal" onBlur={(e) => { const c = parseMoney(e.target.value); if (c !== null && c !== i.price_cents) save(i, { price_cents: c }); }} className={inputClass} />
              <button onClick={() => remove(i.id)} aria-label={`Delete ${i.label}`} className={btnGhost}>✕</button>
            </li>
          ))}
          {items.length === 0 && <li className="text-sm text-muted">No rates yet. Add your first one below.</li>}
        </ul>
        <form onSubmit={add} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
          <input name="label" required maxLength={120} placeholder="Dedicated video" aria-label="New format" className={inputClass} />
          <input name="description" maxLength={300} placeholder="Description (optional)" aria-label="New description" className={inputClass} />
          <input name="price" required inputMode="decimal" placeholder="1200" aria-label="New price" className={inputClass} />
          <button className={btnPrimary}>Add</button>
        </form>
      </section>
    </div>
  );
}
