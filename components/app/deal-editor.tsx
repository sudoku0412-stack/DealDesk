"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatMoney, parseMoney, relativeDue } from "@/lib/app/format";
import { FREE_LIMIT_MESSAGE, STAGES, type Deal, type Deliverable, type Payment, type Stage } from "@/lib/app/types";
import { PLATFORMS } from "@/lib/config";
import { Pill, btnGhost, btnPrimary, inputClass } from "@/components/app/pill";

type Props = { deal: Deal; initialDeliverables: Deliverable[]; initialPayments: Payment[]; currency: string; today: string };

export function DealEditor({ deal: initial, initialDeliverables, initialPayments, currency, today }: Props) {
  const router = useRouter();
  const db = supabaseBrowser();
  const [deal, setDeal] = useState(initial);
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [payments, setPayments] = useState(initialPayments);
  const [status, setStatus] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  const fail = (error: { message: string } | null, fallback: string) => {
    setStatus({ tone: "bad", text: error?.message.includes("free_limit") ? FREE_LIMIT_MESSAGE : fallback });
    return !!error;
  };

  async function saveDeal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const amount = parseMoney(String(f.get("amount") || "0"));
    if (amount === null) return setStatus({ tone: "bad", text: "Enter a valid amount." });
    const patch = {
      brand: String(f.get("brand")).trim(),
      platform: String(f.get("platform") || "") || null,
      amount_cents: amount,
      stage: String(f.get("stage")) as Stage,
      contact_name: String(f.get("contact_name") || "").trim() || null,
      contact_email: String(f.get("contact_email") || "").trim() || null,
      notes: String(f.get("notes") || "").trim() || null,
    };
    const { error } = await db.from("deals").update(patch).eq("id", deal.id);
    if (fail(error, "Could not save. Try again.")) return;
    setDeal({ ...deal, ...patch });
    setStatus({ tone: "ok", text: "Saved." });
  }

  async function addDeliverable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const { data, error } = await db
      .from("deliverables")
      .insert({ deal_id: deal.id, title: String(f.get("title")).trim(), due_date: String(f.get("due") || "") || null })
      .select("id,deal_id,title,due_date,done")
      .single();
    if (fail(error, "Could not add the deliverable.") || !data) return;
    setDeliverables((d) => [...d, data as Deliverable]);
    form.reset();
  }

  async function toggleDeliverable(d: Deliverable) {
    const { error } = await db.from("deliverables").update({ done: !d.done }).eq("id", d.id);
    if (!fail(error, "Could not update.")) setDeliverables((all) => all.map((x) => (x.id === d.id ? { ...x, done: !d.done } : x)));
  }

  async function removeDeliverable(id: string) {
    const { error } = await db.from("deliverables").delete().eq("id", id);
    if (!fail(error, "Could not delete.")) setDeliverables((all) => all.filter((x) => x.id !== id));
  }

  async function addPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const amount = parseMoney(String(f.get("amount") || ""));
    if (amount === null) return setStatus({ tone: "bad", text: "Enter a valid payment amount." });
    const { data, error } = await db
      .from("payments")
      .insert({
        deal_id: deal.id,
        label: String(f.get("label") || "Payment").trim() || "Payment",
        amount_cents: amount,
        invoiced_on: String(f.get("invoiced") || "") || null,
        due_on: String(f.get("due") || "") || null,
      })
      .select("*")
      .single();
    if (fail(error, "Could not add the payment.") || !data) return;
    setPayments((p) => [...p, data as Payment]);
    form.reset();
  }

  async function setPaid(p: Payment, paid: boolean) {
    const paid_on = paid ? today : null;
    const { error } = await db.from("payments").update({ paid_on }).eq("id", p.id);
    if (!fail(error, "Could not update.")) setPayments((all) => all.map((x) => (x.id === p.id ? { ...x, paid_on } : x)));
  }

  async function removePayment(id: string) {
    const { error } = await db.from("payments").delete().eq("id", id);
    if (!fail(error, "Could not delete.")) setPayments((all) => all.filter((x) => x.id !== id));
  }

  async function archive() {
    const { error } = await db.from("deals").update({ archived: true }).eq("id", deal.id);
    if (!fail(error, "Could not archive.")) router.push("/app");
  }

  async function remove() {
    if (!window.confirm(`Delete ${deal.brand} and all its deliverables and payments? This cannot be undone.`)) return;
    const { error } = await db.from("deals").delete().eq("id", deal.id);
    if (!fail(error, "Could not delete.")) router.push("/app");
  }

  const paidTotal = payments.filter((p) => p.paid_on).reduce((a, p) => a + p.amount_cents, 0);
  const invoicedTotal = payments.reduce((a, p) => a + p.amount_cents, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app" className="text-sm font-semibold text-muted hover:text-fg">
          ← Pipeline
        </Link>
        <h1 className="mt-2 text-3xl font-extrabold">{deal.brand}</h1>
        <p className="text-muted">
          {formatMoney(deal.amount_cents, currency)} · {formatMoney(paidTotal, currency)} of {formatMoney(invoicedTotal, currency)} invoiced has been paid
        </p>
      </div>

      <p role="status" className={`min-h-5 text-sm font-semibold ${status?.tone === "bad" ? "text-[#c0270a] dark:text-[#ff9a7a]" : "text-green-text"}`}>
        {status?.text}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveDeal} className="glass space-y-3 rounded-2xl p-5">
          <h2 className="font-display text-lg font-bold">Details</h2>
          <L label="Brand"><input name="brand" required maxLength={120} defaultValue={deal.brand} className={inputClass} /></L>
          <div className="grid grid-cols-2 gap-3">
            <L label={`Deal value (${currency})`}><input name="amount" inputMode="decimal" defaultValue={(deal.amount_cents / 100).toString()} className={inputClass} /></L>
            <L label="Stage">
              <select name="stage" defaultValue={deal.stage} className={inputClass}>
                {STAGES.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
              </select>
            </L>
          </div>
          <L label="Platform">
            <select name="platform" defaultValue={deal.platform ?? ""} className={inputClass}>
              <option value="">None</option>
              {PLATFORMS.map((p) => (<option key={p}>{p}</option>))}
            </select>
          </L>
          <div className="grid grid-cols-2 gap-3">
            <L label="Contact name"><input name="contact_name" maxLength={120} defaultValue={deal.contact_name ?? ""} className={inputClass} /></L>
            <L label="Contact email"><input name="contact_email" type="email" maxLength={254} defaultValue={deal.contact_email ?? ""} className={inputClass} /></L>
          </div>
          <L label="Notes (usage rights, brief, links)">
            <textarea name="notes" rows={4} maxLength={5000} defaultValue={deal.notes ?? ""} className={`${inputClass} h-auto py-2`} />
          </L>
          <button className={btnPrimary}>Save changes</button>
        </form>

        <div className="space-y-6">
          <section className="glass rounded-2xl p-5" aria-labelledby="deliverables-title">
            <h2 id="deliverables-title" className="font-display text-lg font-bold">Deliverables and deadlines</h2>
            <ul className="mt-3 divide-y divide-line/60">
              {deliverables.map((d) => {
                const due = d.done ? null : relativeDue(today, d.due_date);
                return (
                  <li key={d.id} className="flex items-center gap-3 py-2.5">
                    <input type="checkbox" checked={d.done} onChange={() => toggleDeliverable(d)} aria-label={`Mark ${d.title} done`} className="size-5 accent-[var(--accent)]" />
                    <span className={`flex-1 text-sm font-medium ${d.done ? "text-muted line-through" : ""}`}>{d.title}</span>
                    {due && d.due_date && <Pill tone={due.tone}>{due.label}</Pill>}
                    <button onClick={() => removeDeliverable(d.id)} aria-label={`Delete ${d.title}`} className="text-muted hover:text-fg">✕</button>
                  </li>
                );
              })}
              {deliverables.length === 0 && <li className="py-3 text-sm text-muted">No deliverables yet.</li>}
            </ul>
            <form onSubmit={addDeliverable} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input name="title" required maxLength={160} placeholder="e.g. 60s Instagram Reel" aria-label="Deliverable" className={inputClass} />
              <input name="due" type="date" aria-label="Due date" className={`${inputClass} sm:w-44`} />
              <button className={btnGhost}>Add</button>
            </form>
          </section>

          <section className="glass rounded-2xl p-5" aria-labelledby="payments-title">
            <h2 id="payments-title" className="font-display text-lg font-bold">Payments</h2>
            <ul className="mt-3 divide-y divide-line/60">
              {payments.map((p) => {
                const overdue = !p.paid_on && p.due_on && p.due_on < today;
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                    <span className="flex-1 font-medium">{p.label} · {formatMoney(p.amount_cents, currency)}</span>
                    {p.paid_on ? <Pill tone="ok">Paid</Pill> : overdue ? <Pill tone="bad">{relativeDue(today, p.due_on).label}</Pill> : p.due_on ? <Pill>Due {relativeDue(today, p.due_on).label.toLowerCase()}</Pill> : <Pill>Unpaid</Pill>}
                    <button onClick={() => setPaid(p, !p.paid_on)} className="text-xs font-semibold underline underline-offset-4">{p.paid_on ? "Undo" : "Mark paid"}</button>
                    <button onClick={() => removePayment(p.id)} aria-label={`Delete ${p.label}`} className="text-muted hover:text-fg">✕</button>
                  </li>
                );
              })}
              {payments.length === 0 && <li className="py-3 text-sm text-muted">No payments tracked yet.</li>}
            </ul>
            <form onSubmit={addPayment} className="mt-3 grid grid-cols-2 gap-2">
              <input name="label" maxLength={120} placeholder="Label (e.g. 50% upfront)" aria-label="Payment label" className={inputClass} />
              <input name="amount" required inputMode="decimal" placeholder={`Amount (${currency})`} aria-label="Payment amount" className={inputClass} />
              <label className="text-xs font-semibold text-muted">Invoiced on<input name="invoiced" type="date" className={`${inputClass} mt-1 text-fg`} /></label>
              <label className="text-xs font-semibold text-muted">Due on<input name="due" type="date" className={`${inputClass} mt-1 text-fg`} /></label>
              <button className={`${btnGhost} col-span-2`}>Add payment</button>
            </form>
          </section>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <button onClick={archive} className={btnGhost}>Archive deal</button>
        <button onClick={remove} className={`${btnGhost} text-[#c0270a] dark:text-[#ff9a7a]`}>Delete deal</button>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold">{label}<span className="mt-1 block font-normal">{children}</span></label>;
}
