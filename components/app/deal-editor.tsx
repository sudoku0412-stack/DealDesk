"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatMoney, parseMoney, relativeDue } from "@/lib/app/format";
import { DELIVERED_BLOCKED_MESSAGE, stageBlocker } from "@/lib/app/rules";
import { FREE_LIMIT_MESSAGE, STAGES, type Deal, type DealNote, type Deliverable, type Payment, type Stage } from "@/lib/app/types";
import { PLATFORMS } from "@/lib/config";
import { Pill, btnGhost, btnPrimary, inputClass } from "@/components/app/pill";
import { DateField } from "@/components/app/date-field";

type Props = { deal: Deal; initialDeliverables: Deliverable[]; initialPayments: Payment[]; initialNotes: DealNote[]; currency: string; today: string };

export function DealEditor({ deal: initial, initialDeliverables, initialPayments, initialNotes, currency, today }: Props) {
  const router = useRouter();
  const db = supabaseBrowser();
  const [deal, setDeal] = useState(initial);
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [payments, setPayments] = useState(initialPayments);
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  /** Shows an error message only when `error` is set. Returns true if there was an error. */
  const fail = (error: { message: string } | null, fallback: string) => {
    if (!error) return false;
    const text = error.message.includes("free_limit")
      ? FREE_LIMIT_MESSAGE
      : error.message.includes("deliverables_incomplete")
        ? DELIVERED_BLOCKED_MESSAGE
        : fallback;
    setStatus({ tone: "bad", text });
    return true;
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
    if (patch.stage !== deal.stage) {
      const reason = stageBlocker(patch.stage, deliverables);
      if (reason) return setStatus({ tone: "bad", text: reason });
    }
    const { error } = await db.from("deals").update(patch).eq("id", deal.id);
    if (fail(error, "Could not save. Try again.")) return;
    setDeal({ ...deal, ...patch });
    setStatus({ tone: "ok", text: "Saved." });
    void refreshNotes();
  }

  async function refreshNotes() {
    const { data } = await db.from("deal_notes").select("id,deal_id,kind,body,created_at").eq("deal_id", deal.id).order("created_at", { ascending: false });
    if (data) setNotes(data as DealNote[]);
  }

  async function addNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = String(new FormData(form).get("note") || "").trim();
    if (!body) return;
    const { error } = await db.from("deal_notes").insert({ deal_id: deal.id, kind: "note", body });
    if (fail(error, "Could not add the note.")) return;
    form.reset();
    await refreshNotes();
  }

  async function removeNote(id: string) {
    const { error } = await db.from("deal_notes").delete().eq("id", id);
    if (!fail(error, "Could not delete the note.")) setNotes((all) => all.filter((n) => n.id !== id));
  }

  async function saveAsTemplate() {
    const name = window.prompt("Name this template", `${deal.brand} template`)?.trim();
    if (!name) return;
    const created = deal.created_at.slice(0, 10);
    const offset = (iso: string | null) => (iso ? Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${created}T00:00:00Z`)) / 86_400_000) : null);
    const { error } = await db.from("deal_templates").insert({
      name: name.slice(0, 80),
      platform: deal.platform,
      amount_cents: deal.amount_cents,
      notes: deal.notes,
      deliverables: deliverables.map((d) => ({ title: d.title, offset_days: offset(d.due_date) })),
      payments: payments.map((p) => ({
        label: p.label,
        percent: deal.amount_cents > 0 ? Math.min(100, Math.round((p.amount_cents / deal.amount_cents) * 100)) : 100,
        due_offset_days: offset(p.due_on),
      })),
    });
    if (!fail(error, "Could not save the template.")) setStatus({ tone: "ok", text: `Saved template "${name}". Pick it when you create a new deal.` });
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
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold">{deal.brand}</h1>
          <span data-stage={deal.stage} className="stage-pill rounded-full px-3 py-1 text-sm font-bold">
            {STAGES.find((s) => s.id === deal.stage)?.label}
          </span>
        </div>
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
            <form onSubmit={addDeliverable} className="mt-3 grid gap-2 sm:grid-cols-[1fr_11rem_auto] sm:items-end">
              <label className="text-xs font-semibold text-muted">
                Deliverable
                <input name="title" required maxLength={160} placeholder="e.g. 60s Instagram Reel" className={`${inputClass} mt-1 text-fg`} />
              </label>
              <label className="text-xs font-semibold text-muted">
                Due date (optional)
                <DateField name="due" label="Due date" />
              </label>
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
            <form onSubmit={addPayment} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input name="label" maxLength={120} placeholder="Label (e.g. 50% upfront)" aria-label="Payment label" className={inputClass} />
              <input name="amount" required inputMode="decimal" placeholder={`Amount (${currency})`} aria-label="Payment amount" className={inputClass} />
              <label className="text-xs font-semibold text-muted">Invoiced on<DateField name="invoiced" label="Invoiced on" /></label>
              <label className="text-xs font-semibold text-muted">Due on<DateField name="due" label="Due on" /></label>
              <button className={`${btnGhost} sm:col-span-2`}>Add payment</button>
            </form>
          </section>
        </div>
      </div>

      <section className="glass rounded-2xl p-5" aria-labelledby="activity-title">
        <h2 id="activity-title" className="font-display text-lg font-bold">Notes and activity</h2>
        <form onSubmit={addNote} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input name="note" required maxLength={2000} placeholder="Add a note (call summary, usage rights, next step)" aria-label="New note" className={inputClass} />
          <button className={btnGhost}>Add note</button>
        </form>
        <ol className="mt-4 space-y-3 border-l-2 border-line pl-4">
          {notes.map((n) => (
            <li key={n.id} className="relative text-sm">
              <span className={`absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full ${n.kind === "note" ? "bg-accent" : "bg-muted"}`} aria-hidden="true" />
              <p className={n.kind === "note" ? "font-medium" : "text-muted"}>{n.body}</p>
              <p className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                <time dateTime={n.created_at} suppressHydrationWarning>
                  {new Date(n.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </time>
                {n.kind === "note" && (
                  <button onClick={() => removeNote(n.id)} className="underline underline-offset-4 hover:text-fg">
                    Delete
                  </button>
                )}
              </p>
            </li>
          ))}
          {notes.length === 0 && <li className="text-sm text-muted">No activity yet.</li>}
        </ol>
      </section>

      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <button onClick={saveAsTemplate} className={btnGhost}>Save as template</button>
        <button onClick={archive} className={btnGhost}>Archive deal</button>
        <button onClick={remove} className={`${btnGhost} text-[#c0270a] dark:text-[#ff9a7a]`}>Delete deal</button>
      </div>
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold">{label}<span className="mt-1 block font-normal">{children}</span></label>;
}
