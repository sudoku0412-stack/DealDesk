"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { formatMoney, parseMoney, relativeDue } from "@/lib/app/format";
import { DELIVERED_BLOCKED_MESSAGE, stageBlocker } from "@/lib/app/rules";
import { FREE_LIMIT_MESSAGE, STAGES, type Deal, type DealTemplate, type Deliverable, type Payment, type Stage } from "@/lib/app/types";
import { BUILTIN_TEMPLATES, applyTemplate, findTemplate } from "@/lib/app/templates";
import { PLATFORMS } from "@/lib/config";
import { Pill, btnGhost, btnPrimary, inputClass } from "@/components/app/pill";

type Props = {
  initialDeals: Deal[];
  deliverables: Deliverable[];
  payments: Payment[];
  templates: DealTemplate[];
  currency: string;
  plan: "free" | "pro";
  today: string;
  onboarded: boolean;
  timezone: string;
};
type Notice = { text: string; dealId?: string; brand?: string };

export function Board({ initialDeals, deliverables: initialDeliverables, payments: initialPayments, templates, currency, plan, today, onboarded: initialOnboarded, timezone }: Props) {
  const [deals, setDeals] = useState(initialDeals);
  const [deliverables, setDeliverables] = useState(initialDeliverables);
  const [payments, setPayments] = useState(initialPayments);
  const [onboarded, setOnboarded] = useState(initialOnboarded);
  const [tplId, setTplId] = useState("");
  const [platformVal, setPlatformVal] = useState("");
  const [amountVal, setAmountVal] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<Stage | null>(null);
  const [movedId, setMovedId] = useState<string | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  /** Time of the last drag. A click right after a drag is the browser finishing the gesture, not a tap to open the deal. */
  const lastDrag = useRef(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const active = deals.filter((d) => d.stage !== "paid").length;
  const atLimit = plan === "free" && active >= 3;

  const forDeal = (id: string) => deliverables.filter((x) => x.deal_id === id);
  const blockerFor = (id: string, target: Stage) => stageBlocker(target, forDeal(id));

  const info = useMemo(() => {
    const m = new Map<string, { nextDue: string | null; overdue: boolean; ready: boolean }>();
    for (const d of deals) {
      const all = deliverables.filter((x) => x.deal_id === d.id);
      const dates = all.filter((x) => !x.done && x.due_date).map((x) => x.due_date!).sort();
      m.set(d.id, {
        nextDue: dates[0] ?? null,
        overdue: payments.some((p) => p.deal_id === d.id && p.due_on && p.due_on < today),
        ready: all.length > 0 && all.every((x) => x.done),
      });
    }
    return m;
  }, [deals, deliverables, payments, today]);

  /** On phones the columns scroll sideways; bring a column into view so a moved card stays visible. */
  function focusStage(stage: Stage) {
    const box = scroller.current;
    const col = box?.querySelector<HTMLElement>(`section[data-stage="${stage}"]`);
    if (!box || !col || window.matchMedia("(min-width: 768px)").matches) return;
    box.scrollTo({ left: Math.max(0, col.offsetLeft - 8), behavior: "smooth" });
  }

  /** Touch dragging: HTML5 drag-and-drop does not fire for fingers, so the grip handle uses pointer events. */
  const touch = useRef<{ id: string; pointerId: number } | null>(null);

  function stageAt(x: number, y: number): Stage | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("section[data-stage]");
    return (el?.dataset.stage as Stage | undefined) ?? null;
  }

  function onGripDown(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (e.pointerType === "mouse") return; // desktop uses native drag-and-drop
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    touch.current = { id, pointerId: e.pointerId };
    lastDrag.current = Date.now();
    setDragId(id);
    setOverStage(deals.find((d) => d.id === id)?.stage ?? null);
  }

  function onGripMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!touch.current) return;
    setOverStage(stageAt(e.clientX, e.clientY));
    const box = scroller.current;
    if (box) {
      const edge = 56;
      if (e.clientX < edge) box.scrollLeft -= 14;
      else if (e.clientX > window.innerWidth - edge) box.scrollLeft += 14;
    }
  }

  function endGrip(e: React.PointerEvent<HTMLButtonElement>, commit: boolean) {
    const t = touch.current;
    if (!t) return;
    touch.current = null;
    lastDrag.current = Date.now();
    const target = commit ? stageAt(e.clientX, e.clientY) : null;
    setDragId(null);
    setOverStage(null);
    if (target) moveDeal(t.id, target);
  }

  function block(deal: Deal, text: string) {
    setNotice({ text, dealId: deal.id, brand: deal.brand });
    setShakeId(deal.id);
    setTimeout(() => setShakeId(null), 500);
  }

  async function moveDeal(id: string, stage: Stage) {
    const prev = deals;
    const deal = prev.find((d) => d.id === id);
    if (!deal || deal.stage === stage) return;

    const reason = blockerFor(id, stage);
    if (reason) return block(deal, reason);

    setDeals(prev.map((d) => (d.id === id ? { ...d, stage } : d)));
    setMovedId(id);
    setTimeout(() => setMovedId((m) => (m === id ? null : m)), 750);
    setNotice(null);
    setTimeout(() => focusStage(stage), 60);

    const { error } = await supabaseBrowser().from("deals").update({ stage }).eq("id", id);
    if (error) {
      setDeals(prev);
      setMovedId(null);
      focusStage(deal.stage);
      if (error.message.includes("deliverables_incomplete")) block(deal, DELIVERED_BLOCKED_MESSAGE);
      else setNotice({ text: error.message.includes("free_limit") ? FREE_LIMIT_MESSAGE : "Could not move that deal. Try again." });
    }
  }

  function pickTemplate(id: string) {
    setTplId(id);
    const t = id ? findTemplate(id, templates) : null;
    if (t) {
      setPlatformVal(t.platform ?? "");
      if (t.amount_cents > 0) setAmountVal(String(t.amount_cents / 100));
    }
  }

  /** Inserts a deal (optionally from a template) and updates local state. Returns an error message or null. */
  async function insertDeal(fields: Partial<Deal> & { brand: string }, template: DealTemplate | null): Promise<string | null> {
    const db = supabaseBrowser();
    const { data, error } = await db.from("deals").insert(fields).select("*").single();
    if (error || !data) return error?.message.includes("free_limit") ? FREE_LIMIT_MESSAGE : "Could not save the deal. Try again.";
    const deal = data as Deal;
    setDeals((d) => [deal, ...d]);
    if (template) {
      const added = await applyTemplate(db, deal.id, template, deal.amount_cents, today);
      setDeliverables((x) => [...x, ...added.deliverables]);
      setPayments((x) => [...x, ...added.payments]);
    }
    return null;
  }

  async function createDeal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const amount = parseMoney(amountVal || "0");
    if (amount === null) return setFormError("Enter a valid amount.");
    setSaving(true);
    setFormError(null);
    const err = await insertDeal(
      {
        brand: String(f.get("brand")).trim(),
        platform: platformVal || null,
        amount_cents: amount,
        contact_name: String(f.get("contact_name") || "").trim() || null,
        contact_email: String(f.get("contact_email") || "").trim() || null,
      },
      tplId ? findTemplate(tplId, templates) : null,
    );
    setSaving(false);
    if (err) return setFormError(err);
    dialog.current?.close();
    form.reset();
    setTplId("");
    setPlatformVal("");
    setAmountVal("");
  }

  async function addSampleDeal() {
    setNotice(null);
    const tpl = BUILTIN_TEMPLATES[0];
    const err = await insertDeal(
      { brand: "Sample brand (delete me)", platform: "YouTube", amount_cents: 150000, contact_name: "Alex Morgan", contact_email: "alex@samplebrand.com" },
      tpl,
    );
    if (err) setNotice({ text: err });
  }

  async function finishOnboarding() {
    setOnboarded(true);
    const db = supabaseBrowser();
    const { data } = await db.auth.getUser();
    if (data.user) await db.from("profiles").update({ onboarded: true }).eq("id", data.user.id);
  }

  // New accounts default to UTC. Adopt the browser's time zone once so reminders arrive at a sensible local hour.
  useEffect(() => {
    if (timezone !== "UTC") return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz || tz === "UTC") return;
      const db = supabaseBrowser();
      void (async () => {
        const { data } = await db.auth.getUser();
        if (data.user) await db.from("profiles").update({ timezone: tz }).eq("id", data.user.id);
      })();
    } catch {
      /* ignore */
    }
  }, [timezone]);

  const checklistDone = deals.length > 0 && deliverables.some((d) => d.due_date) && payments.length > 0;
  useEffect(() => {
    if (!onboarded && checklistDone) void finishOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklistDone, onboarded]);

  const total = deals.filter((d) => d.stage !== "paid").reduce((a, d) => a + d.amount_cents, 0);
  const dragged = dragId ? deals.find((d) => d.id === dragId) : null;

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

      {deals.length === 0 && (
        <section aria-labelledby="welcome-title" className="glass mt-6 rounded-3xl p-6 sm:p-8">
          <h2 id="welcome-title" className="text-2xl font-extrabold">
            Welcome to DealDesk
          </h2>
          <p className="mt-2 max-w-xl text-muted">Track every brand deal from pitch to paid. Here is how it works:</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Add a deal", "Brand, value and platform. Start from a template to prefill deliverables and payments."],
              ["2", "Move it forward", "Drag it across the pipeline. We remind you before every deadline."],
              ["3", "Get paid", "Log invoices and due dates. Late payments get flagged."],
            ].map(([n, t, d]) => (
              <li key={n} className="rounded-2xl border border-line bg-surface-solid p-4">
                <span className="grid size-7 place-items-center rounded-full bg-accent text-sm font-extrabold text-accent-ink">{n}</span>
                <p className="mt-2 font-display font-bold">{t}</p>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className={btnPrimary} onClick={() => dialog.current?.showModal()}>
              Add your first deal
            </button>
            <button className={btnGhost} onClick={addSampleDeal}>
              Try a sample deal
            </button>
          </div>
        </section>
      )}

      {!onboarded && deals.length > 0 && (
        <section aria-label="Getting started" className="glass mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl p-4 text-sm">
          <p className="font-display font-bold">Getting started</p>
          {[
            ["Add a deal", deals.length > 0],
            ["Add a deliverable with a date", deliverables.some((d) => d.due_date)],
            ["Track a payment", payments.length > 0],
          ].map(([label, done]) => (
            <p key={String(label)} className={done ? "text-green-text" : "text-muted"}>
              {done ? "✓" : "○"} {label}
            </p>
          ))}
          <button onClick={finishOnboarding} className="ml-auto font-semibold underline underline-offset-4">
            Dismiss
          </button>
        </section>
      )}

      {(notice || atLimit) && (
        <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3 text-sm">
          <p className="min-w-0 flex-1">{notice?.text ?? FREE_LIMIT_MESSAGE}</p>
          {notice?.dealId && (
            <Link href={`/app/deals/${notice.dealId}`} className="shrink-0 rounded-lg bg-accent px-3 py-1.5 font-bold text-accent-ink">
              Open {notice.brand}
            </Link>
          )}
        </div>
      )}

      {dragged && overStage && touch.current && (
        <div role="status" className="pointer-events-none fixed inset-x-4 top-4 z-50 rounded-xl bg-fg px-4 py-2.5 text-center text-sm font-bold text-bg shadow-lg md:hidden">
          {overStage === dragged.stage ? `${dragged.brand}: drag to another stage` : `Release to move ${dragged.brand} to ${STAGES.find((x) => x.id === overStage)?.label}`}
        </div>
      )}

      <nav aria-label="Jump to stage" className="mt-5 flex gap-2 overflow-x-auto pb-1 md:hidden">
        {STAGES.map((s) => (
          <button
            key={s.id}
            data-stage={s.id}
            onClick={() => focusStage(s.id)}
            className="stage-pill flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
          >
            {s.label}
            <span className="rounded-full bg-fg/10 px-1.5 tabular-nums">{deals.filter((d) => d.stage === s.id).length}</span>
          </button>
        ))}
      </nav>

      <div ref={scroller} className="relative mt-3 flex snap-x gap-3 overflow-x-auto pb-4 md:mt-6 md:grid md:grid-cols-5 md:overflow-visible">
        {STAGES.map((s) => {
          const col = deals.filter((d) => d.stage === s.id);
          const refused = !!dragged && overStage === s.id && dragged.stage !== s.id && !!blockerFor(dragged.id, s.id);
          return (
            <section
              key={s.id}
              data-stage={s.id}
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
              className={`stage-col min-h-[320px] w-[78vw] shrink-0 snap-start rounded-2xl p-2 sm:w-64 md:w-auto ${
                refused ? "!border-[#ff4d3a] !bg-[#ff4d3a]/10" : overStage === s.id && dragId ? "ring-2 ring-[var(--c)]" : ""
              }`}
            >
              <h2 className="flex items-center gap-2 px-2 py-2 font-display text-sm font-bold">
                <span className="size-2.5 rounded-full bg-[var(--c)]" aria-hidden="true" />
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
                      data-stage={d.stage}
                      draggable
                      onDragStart={() => {
                        lastDrag.current = Date.now();
                        setDragId(d.id);
                      }}
                      onDragEnd={() => {
                        lastDrag.current = Date.now();
                        setDragId(null);
                        setOverStage(null);
                      }}
                      onClickCapture={(e) => {
                        if (Date.now() - lastDrag.current < 700) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                      className={`stage-card relative cursor-grab select-none rounded-xl p-3 shadow-sm active:cursor-grabbing ${dragId === d.id ? "opacity-50" : ""} ${
                        movedId === d.id ? "animate-pop" : ""
                      } ${shakeId === d.id ? "animate-shake" : ""}`}
                    >
                      <button
                        type="button"
                        aria-label={`Drag ${d.brand} to another stage`}
                        onPointerDown={(e) => onGripDown(e, d.id)}
                        onPointerMove={onGripMove}
                        onPointerUp={(e) => endGrip(e, true)}
                        onPointerCancel={(e) => endGrip(e, false)}
                        onContextMenu={(e) => e.preventDefault()}
                        className="absolute right-1 top-1 grid size-9 touch-none place-items-center rounded-lg text-muted active:bg-fg/10 md:hidden"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
                          <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
                          <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
                        </svg>
                      </button>
                      <Link href={`/app/deals/${d.id}`} draggable={false} className="block [-webkit-touch-callout:none]">
                        <div className="flex items-start justify-between gap-2 pr-7 md:pr-0">
                          <p className="font-display text-sm font-bold leading-tight">{d.brand}</p>
                          <p className="text-xs font-semibold tabular-nums">{formatMoney(d.amount_cents, currency)}</p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {d.platform && <Pill>{d.platform}</Pill>}
                          {d.stage === "signed" && i?.ready && <Pill tone="ok">Ready to deliver</Pill>}
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
          <label className="block text-sm font-semibold">
            Start from a template
            <select value={tplId} onChange={(e) => pickTemplate(e.target.value)} className={`${inputClass} mt-1 font-normal`}>
              <option value="">Blank deal</option>
              {templates.length > 0 && (
                <optgroup label="Your templates">
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Starter templates">
                {BUILTIN_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <Field label="Brand" name="brand" required maxLength={120} placeholder="Glowbar Energy" />
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">
              {`Amount (${currency})`}
              <input value={amountVal} onChange={(e) => setAmountVal(e.target.value)} inputMode="decimal" placeholder="2400" className={`${inputClass} mt-1 font-normal`} />
            </label>
            <label className="block text-sm font-semibold">
              Platform
              <select value={platformVal} onChange={(e) => setPlatformVal(e.target.value)} className={`${inputClass} mt-1`}>
                <option value="">Select…</option>
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
          {tplId && <p className="text-xs text-muted">Deliverables and payment milestones from this template are added automatically. Payments need an amount above.</p>}
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
