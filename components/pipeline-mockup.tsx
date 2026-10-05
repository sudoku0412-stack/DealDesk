"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as m from "framer-motion/m";
import { AnimatePresence, useReducedMotion } from "framer-motion";

const BOARD_W = 760;
const BOARD_H = 392;

const COLUMNS = [
  { name: "Pitched", dot: "bg-muted" },
  { name: "Negotiating", dot: "bg-amber" },
  { name: "Signed", dot: "bg-accent" },
  { name: "Delivered", dot: "bg-[#7c5cff]" },
  { name: "Paid", dot: "bg-green" },
] as const;

const FILLERS: { col: number; brand: string; amount: string; tag: string; chip?: { text: string; tone: "warn" | "ok" | "bad" } }[] = [
  { col: 0, brand: "Lumen Desk", amount: "$600", tag: "YouTube" },
  { col: 0, brand: "PixelPods", amount: "$350", tag: "TikTok" },
  { col: 1, brand: "TrailMix Co", amount: "$1,200", tag: "Instagram" },
  { col: 2, brand: "Brewline", amount: "$900", tag: "Twitch", chip: { text: "Due in 2d", tone: "warn" } },
  { col: 3, brand: "Nova Skincare", amount: "$1,800", tag: "YouTube", chip: { text: "Invoice 4d late", tone: "bad" } },
  { col: 4, brand: "Fieldnote", amount: "$750", tag: "TikTok", chip: { text: "Paid", tone: "ok" } },
];

const chipTone = {
  warn: "bg-amber/25 text-[#8a5d00] dark:text-amber",
  bad: "bg-[#ff4d3a]/15 text-[#b3200f] dark:text-[#ff8a7a]",
  ok: "bg-green/20 text-green-text",
} as const;

function Card({ brand, amount, tag, chip }: { brand: string; amount: string; tag: string; chip?: { text: string; tone: keyof typeof chipTone } }) {
  return (
    <div className="rounded-xl border border-line bg-surface-solid p-2.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate font-display text-[13px] font-bold leading-tight">{brand}</p>
        <p className="text-[12px] font-semibold tabular-nums">{amount}</p>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-fg/5 px-1.5 py-0.5 text-[10px] font-medium text-muted">{tag}</span>
        {chip && <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${chipTone[chip.tone]}`}>{chip.text}</span>}
      </div>
    </div>
  );
}

/** Scales the fixed-size board to the available width so it never reflows. */
function useFitScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(Math.min(1, el.clientWidth / BOARD_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, scale };
}

export function PipelineMockup() {
  const reduce = useReducedMotion();
  const { ref, scale } = useFitScale();
  const [stage, setStage] = useState(reduce ? 4 : 0);

  useEffect(() => {
    if (reduce) {
      setStage(4);
      return;
    }
    // Step through the pipeline, linger on "Paid", then start over.
    const id = setTimeout(() => setStage((s) => (s >= 4 ? 0 : s + 1)), stage === 4 ? 3400 : 1500);
    return () => clearTimeout(id);
  }, [reduce, stage]);

  const paid = stage === 4;
  const colW = BOARD_W / COLUMNS.length;

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Animated preview of the DealDesk pipeline board: a sponsorship deal moves from Pitched through Negotiating, Signed and Delivered, and ends in Paid."
      className="relative mx-auto w-full max-w-[760px]"
      style={{ height: BOARD_H * scale }}
    >
      <div
        className="glass absolute left-0 top-0 origin-top-left rounded-3xl p-3"
        style={{ width: BOARD_W, height: BOARD_H, transform: `scale(${scale})` }}
        aria-hidden="true"
      >
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <p className="font-display text-xs font-bold tracking-wide text-muted">Deals · This month</p>
          <p className="rounded-full bg-green/15 px-2 py-0.5 text-[11px] font-semibold text-green-text">$7,600 tracked</p>
        </div>

        <div className="relative grid grid-cols-5">
          {COLUMNS.map((col, i) => (
            <div key={col.name} className="px-1">
              <div className="mb-2 flex items-center gap-1.5 px-1">
                <span className={`size-2 rounded-full ${col.dot}`} />
                <p className="font-display text-[12px] font-bold">{col.name}</p>
              </div>
              <div className="flex min-h-[290px] flex-col gap-2 rounded-2xl bg-fg/[0.04] p-1.5">
                {/* Reserved slot where the animated card lands */}
                <div className="h-[62px]" />
                {FILLERS.filter((f) => f.col === i).map((f) => (
                  <Card key={f.brand} {...f} />
                ))}
              </div>
            </div>
          ))}

          <m.div
            className="absolute top-[30px] z-10 px-[10px]"
            style={{ width: colW }}
            initial={false}
            animate={{ left: stage * colW }}
            transition={{ type: "spring", stiffness: 140, damping: 20 }}
          >
            <div
              className={`rounded-xl border p-2.5 shadow-lg transition-colors duration-500 ${
                paid ? "animate-pulse-ring border-green bg-green/15" : "border-accent bg-surface-solid"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-display text-[13px] font-bold leading-tight">Glowbar Energy</p>
                <p className="text-[12px] font-semibold tabular-nums">$2,400</p>
              </div>
              <div className="mt-1.5 flex h-[18px] items-center">
                <AnimatePresence mode="wait" initial={false}>
                  <m.span
                    key={paid ? "paid" : "open"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                      paid ? "bg-green text-accent-ink" : "bg-accent/20 text-accent-text"
                    }`}
                  >
                    {paid ? "✓ Paid in full" : "Instagram Reel"}
                  </m.span>
                </AnimatePresence>
              </div>
            </div>
          </m.div>
        </div>
      </div>
    </div>
  );
}
