import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { computeStats, computeTraffic, fetchSignups, fetchViews } from "@/lib/admin-data";
import { APP_NAME, PLATFORMS } from "@/lib/config";
import { Logo } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type Search = { q?: string; platform?: string; page?: string };

function href(params: Search) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.platform) sp.set("platform", params.platform);
  if (params.page && params.page !== "1") sp.set("page", params.page);
  const qs = sp.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

function countryName(code: string) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

const fmt = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  if (!(await isAdmin())) redirect("/admin/login");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const platform = PLATFORMS.find((p) => p === sp.platform) ?? "";

  const [{ rows, error }, { rows: views, error: viewsError }] = await Promise.all([fetchSignups(), fetchViews()]);
  const stats = computeStats(rows);
  const traffic = computeTraffic(views, rows);

  const filtered = rows
    .filter((r) => (!platform || r.platform === platform) && (!q || r.email.includes(q.toLowerCase())))
    .reverse();
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const delta = stats.last7 - stats.prev7;
  const maxDay = Math.max(1, ...traffic.series.map((d) => Math.max(d.visitors, d.signups)));
  const maxPlatform = Math.max(1, ...stats.byPlatform.map((p) => p.count));

  return (
    <>
      <header className="border-b border-line px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-accent-text">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form method="post" action="/api/admin/logout">
              <button className="h-10 rounded-full border border-line px-4 text-sm font-semibold transition hover:bg-surface">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">{APP_NAME} waitlist</h1>
          <p className="mt-1 text-muted">Everyone who has signed up. Times are UTC.</p>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-line bg-surface-solid p-4 text-[#c0270a] dark:text-[#ff9a7a]">
            Could not load signups: {error}
          </p>
        )}

        {viewsError && (
          <p role="alert" className="rounded-xl border border-line bg-surface-solid p-4 text-sm text-muted">
            Visitor analytics is not set up yet ({viewsError}). Run the <code className="font-mono">page_views</code> SQL from{" "}
            <code className="font-mono">supabase/schema.sql</code> in the Supabase SQL editor.
          </p>
        )}

        <section aria-label="Traffic" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Visitors (30 days)" value={traffic.visitors30} hint={`${traffic.visitorsToday} today · ${traffic.visitors7} in 7 days`} />
          <Stat label="Page views (30 days)" value={traffic.views30} />
          <Stat label="Signups (30 days)" value={traffic.signups30} />
          <Stat
            label="Conversion rate"
            value={traffic.conversion === null ? "–" : `${traffic.conversion.toFixed(1)}%`}
            hint={traffic.trackingSince ? `Signups ÷ visitors since ${traffic.trackingSince}` : "Starts once visits are recorded"}
          />
        </section>

        <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Total signups" value={stats.total} />
          <Stat label="Today" value={stats.today} />
          <Stat
            label="Last 7 days"
            value={stats.last7}
            hint={`${delta >= 0 ? "+" : ""}${delta} vs previous 7 days`}
          />
          <Stat label="Last 30 days" value={stats.last30} hint={stats.total ? `Top platform: ${stats.topPlatform.platform}` : undefined} />
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="glass rounded-2xl p-5 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">Visitors and signups (last 30 days)</h2>
              <p className="flex items-center gap-4 text-xs font-semibold text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-fg/30" aria-hidden="true" /> Visitors
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-sm bg-accent" aria-hidden="true" /> Signups
                </span>
              </p>
            </div>
            <div
              role="img"
              aria-label={`Bar chart of daily visitors and signups over the last 30 days. Visitors: ${traffic.visitors30}. Signups: ${traffic.signups30}.`}
              className="mt-4 flex h-40 items-end gap-1"
            >
              {traffic.series.map((d) => (
                <div key={d.day} className="flex h-full flex-1 items-end gap-px" title={`${d.day}: ${d.visitors} visitors, ${d.signups} signups`}>
                  <div className="w-1/2 rounded-t bg-fg/30" style={{ height: `${d.visitors ? Math.max(4, (d.visitors / maxDay) * 100) : 2}%` }} />
                  <div className={`w-1/2 rounded-t ${d.signups ? "bg-accent" : "bg-fg/10"}`} style={{ height: `${d.signups ? Math.max(4, (d.signups / maxDay) * 100) : 2}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted" aria-hidden="true">
              <span>{traffic.series[0].day}</span>
              <span>{traffic.series[29].day}</span>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <h2 className="font-display text-lg font-bold">By platform</h2>
            <ul className="mt-4 space-y-3">
              {stats.byPlatform.map((p) => (
                <li key={p.platform}>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{p.platform}</span>
                    <span className="tabular-nums">
                      {p.count}
                      {stats.total ? <span className="font-normal text-muted"> · {Math.round((p.count / stats.total) * 100)}%</span> : null}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-fg/10">
                    <div className="h-2 rounded-full bg-accent" style={{ width: `${(p.count / maxPlatform) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {[
            { title: "Top sources (30 days)", rows: traffic.referrers, label: (k: string) => k },
            { title: "Top countries (30 days)", rows: traffic.countries, label: countryName },
          ].map((list) => (
            <div key={list.title} className="glass rounded-2xl p-5">
              <h2 className="font-display text-lg font-bold">{list.title}</h2>
              {list.rows.length === 0 ? (
                <p className="mt-3 text-sm text-muted">No data yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line/60 text-sm">
                  {list.rows.map(([k, n]) => (
                    <li key={k} className="flex justify-between py-2">
                      <span className="font-medium">{list.label(k)}</span>
                      <span className="tabular-nums text-muted">{n} views</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>

        <section aria-labelledby="signups-title" className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="signups-title" className="font-display text-lg font-bold">
              Signups <span className="font-normal text-muted">({filtered.length})</span>
            </h2>
            <a
              href="/api/admin/export"
              className="inline-flex h-10 items-center rounded-full bg-fg px-5 text-sm font-bold text-bg transition hover:opacity-90"
            >
              Export CSV
            </a>
          </div>

          <form method="get" action="/admin" className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="q" className="sr-only">
              Search email
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder="Search email…"
              className="h-11 flex-1 rounded-xl border border-line bg-surface-solid px-4"
            />
            <label htmlFor="platform" className="sr-only">
              Platform
            </label>
            <select id="platform" name="platform" defaultValue={platform} className="h-11 rounded-xl border border-line bg-surface-solid px-3">
              <option value="">All platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button className="h-11 rounded-xl bg-accent px-5 font-bold text-accent-ink">Filter</button>
          </form>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <caption className="sr-only">Waitlist signups, newest first</caption>
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 pr-4 font-semibold">#</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Email</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Platform</th>
                  <th scope="col" className="py-2 font-semibold">Joined (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr key={r.id} className="border-b border-line/60 last:border-0">
                    <td className="py-3 pr-4 tabular-nums text-muted">{r.position}</td>
                    <td className="py-3 pr-4 font-medium">{r.email}</td>
                    <td className="py-3 pr-4">
                      <span className="rounded-md bg-fg/6 px-2 py-0.5 text-xs font-semibold">{r.platform}</span>
                    </td>
                    <td className="py-3 tabular-nums text-muted">{fmt.format(new Date(r.created_at))}</td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-muted">
                      {rows.length === 0 ? "No signups yet." : "No signups match your filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link href={href({ q, platform, page: String(page - 1) })} className="font-semibold underline-offset-4 hover:underline">
                  ← Newer
                </Link>
              ) : (
                <span />
              )}
              <span className="text-muted">
                Page {page} of {pages}
              </span>
              {page < pages ? (
                <Link href={href({ q, platform, page: String(page + 1) })} className="font-semibold underline-offset-4 hover:underline">
                  Older →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </main>
    </>
  );
}
