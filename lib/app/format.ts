export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: cents % 100 === 0 ? 0 : 2 }).format(cents / 100);
}

/** "1,200" / "1200.50" / "$1,200" to cents, or null if invalid. */
export function parseMoney(input: string): number | null {
  const n = Number(input.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n >= 0 && /\d/.test(input) ? Math.round(n * 100) : null;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

/** Today's date (YYYY-MM-DD) in an IANA time zone. Falls back to UTC for an unknown zone. */
export function todayIn(timeZone?: string | null, now = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timeZone || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/** The hour (0-23) it currently is in an IANA time zone. */
export function hourIn(timeZone?: string | null, now = new Date()) {
  try {
    const h = new Intl.DateTimeFormat("en-GB", { timeZone: timeZone || "UTC", hour: "2-digit", hourCycle: "h23" }).format(now);
    return Number.parseInt(h, 10) % 24;
  } catch {
    return now.getUTCHours();
  }
}

export const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

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
