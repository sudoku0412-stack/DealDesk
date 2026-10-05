import { PLATFORMS } from "@/lib/config";
import { getSupabase } from "@/lib/supabase";

export type Signup = { id: string; email: string; platform: string; created_at: string; position: number };

const PAGE = 1000;
const MAX_ROWS = 20000;

/** Every signup, oldest first, with its "#N on the list" position. */
export async function fetchSignups(): Promise<{ rows: Signup[]; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], error: "Supabase is not configured." };

  const all: Omit<Signup, "position">[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await supabase
      .from("waitlist")
      .select("id,email,platform,created_at")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { rows: [], error: error.message };
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return { rows: all.map((r, i) => ({ ...r, position: i + 1 })) };
}

const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export function computeStats(rows: Signup[], now = new Date()) {
  const todayStart = new Date(`${dayKey(now)}T00:00:00Z`).getTime();
  const within = (days: number, offset = 0) =>
    rows.filter((r) => {
      const t = new Date(r.created_at).getTime();
      return t >= todayStart - (days - 1 + offset) * DAY && t < todayStart + DAY - offset * DAY;
    }).length;

  const last7 = within(7);
  const prev7 = rows.filter((r) => {
    const t = new Date(r.created_at).getTime();
    return t >= todayStart - 13 * DAY && t < todayStart - 6 * DAY;
  }).length;

  const perDay = new Map<string, number>();
  for (const r of rows) perDay.set(r.created_at.slice(0, 10), (perDay.get(r.created_at.slice(0, 10)) ?? 0) + 1);
  const series = Array.from({ length: 30 }, (_, i) => {
    const key = dayKey(new Date(todayStart - (29 - i) * DAY));
    return { day: key, count: perDay.get(key) ?? 0 };
  });

  const byPlatform = PLATFORMS.map((p) => ({ platform: p, count: rows.filter((r) => r.platform === p).length }));

  return {
    total: rows.length,
    today: within(1),
    last7,
    prev7,
    last30: within(30),
    series,
    byPlatform,
    topPlatform: [...byPlatform].sort((a, b) => b.count - a.count)[0],
  };
}

export type View = { visitor: string; created_at: string; referrer: string | null; country: string | null };

/** Page views from the last 30 days (UTC), newest data included. */
export async function fetchViews(now = new Date()): Promise<{ rows: View[]; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { rows: [], error: "Supabase is not configured." };

  const since = new Date(new Date(`${dayKey(now)}T00:00:00Z`).getTime() - 29 * DAY).toISOString();
  const all: View[] = [];
  for (let from = 0; from < 50000; from += PAGE) {
    const { data, error } = await supabase
      .from("page_views")
      .select("visitor,created_at,referrer,country")
      .gte("created_at", since)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { rows: [], error: error.message };
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return { rows: all };
}

/** Visitors are unique per day (the hash rotates daily), so multi-day totals sum the daily uniques. */
export function computeTraffic(views: View[], signups: Signup[], now = new Date()) {
  const todayStart = new Date(`${dayKey(now)}T00:00:00Z`).getTime();
  const days = Array.from({ length: 30 }, (_, i) => dayKey(new Date(todayStart - (29 - i) * DAY)));

  const visitorsByDay = new Map<string, Set<string>>();
  const viewsByDay = new Map<string, number>();
  for (const v of views) {
    const d = v.created_at.slice(0, 10);
    (visitorsByDay.get(d) ?? visitorsByDay.set(d, new Set()).get(d)!).add(v.visitor);
    viewsByDay.set(d, (viewsByDay.get(d) ?? 0) + 1);
  }
  const signupsByDay = new Map<string, number>();
  for (const s of signups) signupsByDay.set(s.created_at.slice(0, 10), (signupsByDay.get(s.created_at.slice(0, 10)) ?? 0) + 1);

  const series = days.map((day) => ({
    day,
    visitors: visitorsByDay.get(day)?.size ?? 0,
    views: viewsByDay.get(day) ?? 0,
    signups: signupsByDay.get(day) ?? 0,
  }));

  const sum = (key: "visitors" | "views" | "signups", n: number) => series.slice(-n).reduce((a, d) => a + d[key], 0);

  // Conversion only counts days we were actually tracking, so older signups don't inflate it.
  const firstTracked = series.findIndex((d) => d.views > 0);
  const tracked = firstTracked === -1 ? [] : series.slice(firstTracked);
  const trackedVisitors = tracked.reduce((a, d) => a + d.visitors, 0);
  const trackedSignups = tracked.reduce((a, d) => a + d.signups, 0);

  const count = (pick: (v: View) => string | null) => {
    const m = new Map<string, number>();
    for (const v of views) {
      const k = pick(v);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  };

  return {
    series,
    trackingSince: firstTracked === -1 ? null : series[firstTracked].day,
    visitorsToday: sum("visitors", 1),
    visitors7: sum("visitors", 7),
    visitors30: sum("visitors", 30),
    views30: sum("views", 30),
    signups30: sum("signups", 30),
    conversion: trackedVisitors ? (trackedSignups / trackedVisitors) * 100 : null,
    referrers: count((v) => v.referrer ?? "Direct"),
    countries: count((v) => v.country),
  };
}
