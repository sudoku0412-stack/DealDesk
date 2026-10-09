const tones = {
  neutral: "bg-fg/6 text-muted",
  warn: "bg-amber/25 text-[#8a5d00] dark:text-amber",
  bad: "bg-[#ff4d3a]/15 text-[#b3200f] dark:text-[#ff8a7a]",
  ok: "bg-green/20 text-green-text",
  accent: "bg-accent/20 text-accent-text",
} as const;

export type Tone = keyof typeof tones;

export function Pill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export const inputClass = "h-11 w-full min-w-0 max-w-full rounded-xl border border-line bg-surface-solid px-3 text-base";
export const btnPrimary =
  "inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 font-display font-bold text-accent-ink transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60";
export const btnGhost =
  "inline-flex h-11 items-center justify-center rounded-xl border border-line bg-surface-solid px-4 text-sm font-semibold transition hover:bg-surface active:scale-[0.98] disabled:opacity-60";
