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
