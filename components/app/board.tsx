"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatMoney, parseMoney, relativeDue } from "@/lib/app/format";
import { FREE_LIMIT_MESSAGE, STAGES, type Deal, type Deliverable, type Payment, type Stage } from "@/lib/app/types";
import { PLATFORMS } from "@/lib/config";
import { Pill, btnGhost, btnPrimary, inputClass } from "@/components/app/pill";

type Props = { initialDeals: Deal[]; deliverables: Deliverable[]; payments: Payment[]; currency: string; plan: "free" | "pro"; today: string };

export function Board({ initialDeals, deliverables, payments, currency, plan, today }: Props) {
  const [deals, setDeals] = useState(initialDeals);
  const [message, setMessage] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const active = deals.filter((d) => d.stage !== "paid").length;
  const atLimit = plan === "free" && active >= 3;

  const info = useMemo(() => {
    const m = new Map<string, { nextDue: string | null; overdue: boolean }>();
    for (const d of deals) {
      const dates = deliverables.filter((x) => x.deal_id === d.id && x.due_date).map((x) => x.due_date!).sort();
      const lateInvoice = payments.some((p) => p.deal_id === d.id && p.due_on && p.due_on < today);
      m.set(d.id, { nextDue: dates[0] ?? null, overdue: lateInvoice });
    }
    return m;
  }, [deals, deliverables, payments, today]);

  async function moveDeal(id: string, stage: Stage) {
    const prev = deals;
    if (prev.find((d) => d.id === id)?.stage === stage) return;
    setDeals(prev.map((d) => (d.id === id ? { ...d, stage } : d)));
    setMessage(null);
    const { error } = await supabaseBrowser().from("deals").update({ stage }).eq("id", id);
    if (error) {
      setDeals(prev);
      setMessage(error.message.includes("free_limit") ? FREE_LIMIT_MESSAGE : "Could not move that deal. Try again.");
    }
  }

  async function createDeal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const amount = parseMoney(String(f.get("amount") || "0"));
    if (amount === null) return setFormError("Enter a valid amount.");
    setSaving(true);
    setFormError(null);
    const { data, error } = await supabaseBrowser()
      .from("deals")
      .insert({
        brand: String(f.get("brand")).trim(),
        platform: String(f.get("platform") || "") || null,
        amount_cents: amount,
        contact_name: String(f.get("contact_name") || "").trim() || null,
        contact_email: String(f.get("contact_email") || "").trim() || null,
      })
      .select("*")
      .single();
    setSaving(false);
    if (error || !data) return setFormError(error?.message.includes("free_limit") ? FREE_LIMIT_MESSAGE : "Could not save the deal. Try again.");
    setDeals((d) => [data as Deal, ...d]);
    dialog.current?.close();
    (e.target as HTMLFormElement).reset();
  }

  const total = deals.filter((d) => d.stage !== "paid").reduce((a, d) => a + d.amount_cents, 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Pipeline</h1>
          <p className="mt-1 text-muted">
            {formatMoney(total, currency)} in play ·{" "}
            <span className={atLimit ? "font-semibold text-accent-text" : ""}>
              {active}/{plan === "free" ? 3 : "∞"} active deals
            </span>
          </p>
        </div>
        <button className={btnPrimary} onClick={() => dialog.current?.showModal()} disabled={atLimit} title={atLimit ? FREE_LIMIT_MESSAGE : undefined}>
          + New deal
        </button>
      </div>

      {(message || atLimit) && (
        <p role="alert" className="mt-4 rounded-xl border border-line bg-surface p-3 text-sm">
          {message ?? FREE_LIMIT_MESSAGE}
        </p>
      )}

      <div className="mt-6 flex snap-x gap-3 overflow-x-auto pb-4 md:grid md:grid-cols-5 md:overflow-visible">
        {STAGES.map((s) => {
          const col = deals.filter((d) => d.stage === s.id);
          return (
            <section
              key={s.id}
              aria-label={`${s.label}, ${col.length} deals`}
              onDragOver={(e) => {
                e.preventDefault();
                setOverStage(s.id);
              }}
              onDragLeave={() => setOverStage((o) => (o === s.id ? null : o))}
              onDrop={() => {
                if (dragId) moveDeal(dragId, s.id);
                setDragId(null);
                setOverStage(null);
              }}
              className={`min-h-[320px] w-[78vw] shrink-0 snap-start rounded-2xl border p-2 transition sm:w-64 md:w-auto ${
                overStage === s.id ? "border-accent bg-accent/10" : "border-line bg-fg/[0.03]"
              }`}
            >
              <h2 className="flex items-center gap-2 px-2 py-2 font-display text-sm font-bold">
                <span className={`size-2 rounded-full ${s.dot}`} aria-hidden="true" />
                {s.label}
                <span className="ml-auto text-xs font-semibold text-muted">{col.length}</span>
              </h2>
              <ul className="space-y-2">
                {col.map((d) => {
                  const i = info.get(d.id);
                  const due = i?.nextDue ? relativeDue(today, i.nextDue) : null;
                  return (
                    <li
                      key={d.id}
                      draggable
                      onDragStart={() => setDragId(d.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                      className={`cursor-grab rounded-xl border border-line bg-surface-solid p-3 shadow-sm active:cursor-grabbing ${dragId === d.id ? "opacity-50" : ""}`}
                    >
                      <Link href={`/app/deals/${d.id}`} draggable={false} className="block">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-display text-sm font-bold leading-tight">{d.brand}</p>
                          <p className="text-xs font-semibold tabular-nums">{formatMoney(d.amount_cents, currency)}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {d.platform && <Pill>{d.platform}</Pill>}
                          {due && <Pill tone={due.tone}>{due.label}</Pill>}
                          {i?.overdue && <Pill tone="bad">Payment overdue</Pill>}
                        </div>
                      </Link>
                      <label className="mt-2 block">
                        <span className="sr-only">Move {d.brand} to stage</span>
                        <select
                          value={d.stage}
                          onChange={(e) => moveDeal(d.id, e.target.value as Stage)}
                          className="h-8 w-full rounded-lg border border-line bg-transparent px-2 text-xs md:hidden"
                        >
                          {STAGES.map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </li>
                  );
                })}
                {col.length === 0 && <li className="px-2 py-6 text-center text-xs text-muted">Drop a deal here</li>}
              </ul>
            </section>
          );
        })}
      </div>

      <dialog ref={dialog} className="m-auto w-[min(92vw,28rem)] rounded-3xl border border-line bg-bg p-0 text-fg backdrop:bg-black/50">
        <form onSubmit={createDeal} className="space-y-3 p-6">
          <h2 className="text-2xl font-extrabold">New deal</h2>
          <Field label="Brand" name="brand" required maxLength={120} placeholder="Glowbar Energy" />
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Amount (${currency})`} name="amount" inputMode="decimal" placeholder="2400" />
            <label className="block text-sm font-semibold">
              Platform
              <select name="platform" className={`${inputClass} mt-1`} defaultValue="">
                <option value="">Select…</option>
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
          <Field label="Contact name" name="contact_name" maxLength={120} />
          <Field label="Contact email" name="contact_email" type="email" maxLength={254} />
          <p role="alert" className="min-h-5 text-sm font-medium text-[#c0270a] dark:text-[#ff9a7a]">
            {formError}
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => dialog.current?.close()}>
              Cancel
            </button>
            <button className={btnPrimary} disabled={saving}>
              {saving ? "Saving…" : "Add deal"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input {...props} className={`${inputClass} mt-1 font-normal`} />
    </label>
  );
}
