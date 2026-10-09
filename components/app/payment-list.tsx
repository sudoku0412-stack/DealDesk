"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatMoney, relativeDue } from "@/lib/app/format";
import { Pill } from "@/components/app/pill";

export type PaymentRow = { id: string; deal_id: string; label: string; amount_cents: number; invoiced_on: string | null; due_on: string | null; paid_on: string | null; brand: string };

export function PaymentList({ initial, currency, today }: { initial: PaymentRow[]; currency: string; today: string }) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function setPaid(p: PaymentRow, paid: boolean) {
    setError(null);
    const paid_on = paid ? today : null;
    const { error } = await supabaseBrowser().from("payments").update({ paid_on }).eq("id", p.id);
    if (error) return setError("Could not update. Try again.");
    setRows((all) => all.map((x) => (x.id === p.id ? { ...x, paid_on } : x)));
  }

  const unpaid = rows.filter((p) => !p.paid_on);
  const overdue = unpaid.filter((p) => p.due_on && p.due_on < today);
  const sum = (list: PaymentRow[]) => list.reduce((a, p) => a + p.amount_cents, 0);
  const month = today.slice(0, 7);
  const paidThisMonth = rows.filter((p) => p.paid_on?.startsWith(month));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Payments</h1>
        <p className="mt-1 text-muted">What you&apos;re owed and what&apos;s late. Add payments from inside a deal.</p>
      </div>

      <section aria-label="Totals" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Outstanding" value={formatMoney(sum(unpaid), currency)} hint={`${unpaid.length} unpaid`} />
        <Card label="Overdue" value={formatMoney(sum(overdue), currency)} hint={`${overdue.length} late`} bad={overdue.length > 0} />
        <Card label="Paid this month" value={formatMoney(sum(paidThisMonth), currency)} hint={`${paidThisMonth.length} received`} />
      </section>

      {error && <p role="alert" className="text-sm font-semibold text-[#c0270a] dark:text-[#ff9a7a]">{error}</p>}

      <div className="glass relative overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">All payments</caption>
          <thead className="text-muted">
            <tr className="border-b border-line">
              {["Brand", "Payment", "Amount", "Due", "Status", ""].map((h) => (<th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const late = !p.paid_on && p.due_on && p.due_on < today;
              return (
                <tr key={p.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 font-semibold"><Link href={`/app/deals/${p.deal_id}`} className="hover:underline">{p.brand}</Link></td>
                  <td className="px-4 py-3 text-muted">{p.label}</td>
                  <td className="px-4 py-3 tabular-nums">{formatMoney(p.amount_cents, currency)}</td>
                  <td className="px-4 py-3 text-muted">{p.due_on ?? "–"}</td>
                  <td className="px-4 py-3">{p.paid_on ? <Pill tone="ok">Paid {p.paid_on}</Pill> : late ? <Pill tone="bad">{relativeDue(today, p.due_on).label}</Pill> : <Pill>Unpaid</Pill>}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setPaid(p, !p.paid_on)} className="text-xs font-semibold underline underline-offset-4">{p.paid_on ? "Undo" : "Mark paid"}</button></td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No payments yet. Open a deal and add one.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ label, value, hint, bad }: { label: string; value: string; hint: string; bad?: boolean }) {
  return (
    <div className={`glass rounded-2xl p-5 ${bad ? "border-[#ff4d3a]/50" : ""}`}>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className={`mt-1 font-display text-3xl font-extrabold tabular-nums ${bad ? "text-[#b3200f] dark:text-[#ff8a7a]" : ""}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
