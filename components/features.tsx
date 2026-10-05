import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

const STAGES = ["Pitched", "Negotiating", "Signed", "Delivered", "Paid"];

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "warn" | "bad" | "ok" }) {
  const tones = {
    neutral: "bg-fg/6 text-muted",
    warn: "bg-amber/25 text-[#8a5d00] dark:text-amber",
    bad: "bg-[#ff4d3a]/15 text-[#b3200f] dark:text-[#ff8a7a]",
    ok: "bg-green/20 text-green-text",
  };
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Features" title="Everything a deal needs. Nothing a sales team does." id="features-title">
          Four tools, built around how creators actually work with brands.
        </SectionHeading>

        <div className="mt-14 grid gap-5 md:grid-cols-6">
          {/* Pipeline */}
          <Reveal className="md:col-span-4">
            <article className="glass h-full rounded-3xl p-7">
              <h3 className="text-2xl font-bold">A pipeline from pitch to paid</h3>
              <p className="mt-2 max-w-md text-muted">
                Drag every deal through five clear stages. See what&apos;s waiting on a brand, what&apos;s waiting on you, and what
                money is on the way.
              </p>
              <ol className="mt-6 flex flex-wrap items-center gap-2" aria-label="Pipeline stages">
                {STAGES.map((s, i) => (
                  <li key={s} className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                        i === STAGES.length - 1 ? "bg-green text-accent-ink" : "border border-line bg-surface-solid"
                      }`}
                    >
                      {s}
                    </span>
                    {i < STAGES.length - 1 && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted" aria-hidden="true">
                        <path d="M9 6l6 6-6 6" />
                      </svg>
                    )}
                  </li>
                ))}
              </ol>
            </article>
          </Reveal>

          {/* Reminders */}
          <Reveal delay={0.08} className="md:col-span-2">
            <article className="glass h-full rounded-3xl p-7">
              <h3 className="text-2xl font-bold">Deadline reminders</h3>
              <p className="mt-2 text-muted">Posting dates and draft approvals, nudged before they bite.</p>
              <ul className="mt-5 space-y-2 text-sm" aria-hidden="true">
                <li className="flex items-center justify-between rounded-xl border border-line bg-surface-solid px-3 py-2">
                  <span className="font-semibold">Draft: Brewline</span>
                  <Pill tone="warn">Tomorrow</Pill>
                </li>
                <li className="flex items-center justify-between rounded-xl border border-line bg-surface-solid px-3 py-2">
                  <span className="font-semibold">Post: TrailMix</span>
                  <Pill>In 5 days</Pill>
                </li>
              </ul>
            </article>
          </Reveal>

          {/* Payments */}
          <Reveal delay={0.04} className="md:col-span-3">
            <article className="glass h-full rounded-3xl p-7">
              <h3 className="text-2xl font-bold">Payment tracking with overdue alerts</h3>
              <p className="mt-2 text-muted">Log what&apos;s invoiced, what&apos;s paid and when it was due. Late money gets flagged automatically.</p>
              <ul className="mt-5 space-y-2 text-sm" aria-hidden="true">
                <li className="flex items-center justify-between rounded-xl border border-line bg-surface-solid px-3 py-2">
                  <span className="font-semibold">Fieldnote · $750</span>
                  <Pill tone="ok">Paid</Pill>
                </li>
                <li className="flex items-center justify-between rounded-xl border border-line bg-surface-solid px-3 py-2">
                  <span className="font-semibold">Glowbar · $2,400</span>
                  <Pill tone="warn">Due in 6 days</Pill>
                </li>
                <li className="flex items-center justify-between rounded-xl border border-line bg-surface-solid px-3 py-2">
                  <span className="font-semibold">Nova Skincare · $1,800</span>
                  <Pill tone="bad">4 days overdue</Pill>
                </li>
              </ul>
            </article>
          </Reveal>

          {/* Rate card */}
          <Reveal delay={0.12} className="md:col-span-3">
            <article className="glass h-full rounded-3xl p-7">
              <h3 className="text-2xl font-bold">A rate card you can send</h3>
              <p className="mt-2 text-muted">Know your price for every format and stop quoting from vibes. Share it with brands in one link.</p>
              <dl className="mt-5 divide-y divide-line rounded-xl border border-line bg-surface-solid text-sm" aria-hidden="true">
                {[
                  ["Dedicated video", "from $1,200"],
                  ["60-second integration", "from $600"],
                  ["Short-form post", "from $250"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between px-3 py-2.5">
                    <dt className="font-semibold">{k}</dt>
                    <dd className="font-display font-bold text-accent-text">{v}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
