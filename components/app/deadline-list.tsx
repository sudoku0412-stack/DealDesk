"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { daysBetween, relativeDue } from "@/lib/app/format";
import { Pill } from "@/components/app/pill";

export type DeadlineRow = { id: string; deal_id: string; title: string; due_date: string | null; done: boolean; brand: string };

export function DeadlineList({ initial, today }: { initial: DeadlineRow[]; today: string }) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function toggle(r: DeadlineRow) {
    setError(null);
    const { error } = await supabaseBrowser().from("deliverables").update({ done: !r.done }).eq("id", r.id);
    if (error) return setError("Could not update. Try again.");
    setRows((all) => all.map((x) => (x.id === r.id ? { ...x, done: !r.done } : x)));
  }

  const open = rows.filter((r) => !r.done);
  const groups = [
    { title: "Overdue", tone: "bad" as const, items: open.filter((r) => r.due_date && daysBetween(today, r.due_date) < 0) },
    { title: "Next 7 days", tone: "warn" as const, items: open.filter((r) => r.due_date && daysBetween(today, r.due_date) >= 0 && daysBetween(today, r.due_date) <= 7) },
    { title: "Later", tone: "neutral" as const, items: open.filter((r) => r.due_date && daysBetween(today, r.due_date) > 7) },
    { title: "No date", tone: "neutral" as const, items: open.filter((r) => !r.due_date) },
  ];
  const done = rows.filter((r) => r.done);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">Deadlines</h1>
        <p className="mt-1 text-muted">Every deliverable across your deals. We email you before they&apos;re due.</p>
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-[#c0270a] dark:text-[#ff9a7a]">{error}</p>}
      {open.length === 0 && <p className="glass rounded-2xl p-6 text-muted">Nothing due. Add deliverables from a deal to see them here.</p>}

      {groups.filter((g) => g.items.length).map((g) => (
        <section key={g.title} aria-label={g.title}>
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">{g.title} <Pill tone={g.tone}>{g.items.length}</Pill></h2>
          <ul className="glass divide-y divide-line/60 rounded-2xl">
            {g.items.map((r) => <Row key={r.id} r={r} today={today} onToggle={toggle} />)}
          </ul>
        </section>
      ))}

      {done.length > 0 && (
        <details className="glass rounded-2xl p-4">
          <summary className="cursor-pointer font-display font-bold">Completed ({done.length})</summary>
          <ul className="mt-2 divide-y divide-line/60">{done.map((r) => <Row key={r.id} r={r} today={today} onToggle={toggle} />)}</ul>
        </details>
      )}
    </div>
  );
}

function Row({ r, today, onToggle }: { r: DeadlineRow; today: string; onToggle: (r: DeadlineRow) => void }) {
  const due = r.done ? null : relativeDue(today, r.due_date);
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <input type="checkbox" checked={r.done} onChange={() => onToggle(r)} aria-label={`Mark ${r.title} done`} className="size-5 accent-[var(--accent)]" />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold ${r.done ? "text-muted line-through" : ""}`}>{r.title}</p>
        <Link href={`/app/deals/${r.deal_id}`} className="text-xs text-muted hover:text-fg">{r.brand}</Link>
      </div>
      {due && r.due_date && <Pill tone={due.tone}>{due.label}</Pill>}
    </li>
  );
}
