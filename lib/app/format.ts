export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}

/** "1,200" / "1200.50" / "$1,200" to cents, or null if invalid. */
export function parseMoney(input: string): number | null {
  const n = Number(input.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 && /\d/.test(input) ? Math.round(n * 100) : null;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

/** Whole days from `today` to `date` (negative = past). Both are YYYY-MM-DD. */
export function daysBetween(today: string, date: string) {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
}

export function relativeDue(today: string, date: string | null) {
  if (!date) return { label: "No date", tone: "neutral" as const };
  const d = daysBetween(today, date);
  if (d < 0) return { label: `${-d}d overdue`, tone: "bad" as const };
  if (d === 0) return { label: "Due today", tone: "warn" as const };
  if (d === 1) return { label: "Due tomorrow", tone: "warn" as const };
  if (d <= 7) return { label: `In ${d} days`, tone: "neutral" as const };
  return { label: new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }), tone: "neutral" as const };
}
