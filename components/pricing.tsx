import { EARLY_ACCESS_OFFER, FREE_DEAL_LIMIT } from "@/lib/config";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

function Check({ muted = false }: { muted?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`mt-0.5 shrink-0 ${muted ? "text-muted" : "text-green-text"}`} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

const FREE = [
  `Up to ${FREE_DEAL_LIMIT} active deals`,
  "Full pipeline board",
  "Deadline reminders",
  "Payment tracking and overdue alerts",
  "Rate card",
];

const PRO = ["Unlimited active deals", "Everything in Free", "Pro features, announced at launch", "Priority support"];

export function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow="Pricing" title="Free to start. Fair when you grow." id="pricing-title">
          Run your first {FREE_DEAL_LIMIT} deals on us. Pro is coming later, and early-access members get {EARLY_ACCESS_OFFER}.
        </SectionHeading>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Reveal>
            <article className="glass h-full rounded-3xl p-8">
              <h3 className="text-2xl font-bold">Free</h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-5xl font-extrabold">$0</span>
                <span className="text-muted">forever</span>
              </p>
              <p className="mt-2 text-muted">Everything you need to run your first few deals.</p>
              <ul className="mt-6 space-y-3">
                {FREE.map((f) => (
                  <li key={f} className="flex gap-3">
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#waitlist"
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl border border-line bg-surface-solid font-display font-bold transition hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Join the waitlist
              </a>
            </article>
          </Reveal>

          <Reveal delay={0.1}>
            <article className="relative h-full overflow-hidden rounded-3xl border border-accent/60 bg-fg p-8 text-bg shadow-card">
              <div className="absolute -right-16 -top-16 size-56 rounded-full bg-accent/40 blur-3xl" aria-hidden="true" />
              <div className="relative flex items-center justify-between">
                <h3 className="text-2xl font-bold">Pro</h3>
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-ink">Coming soon</span>
              </div>
              <p className="relative mt-3 font-display text-3xl font-extrabold">Price announced at launch</p>
              <p className="relative mt-2 text-bg/70">
                Waitlist members lock in <strong className="text-bg">{EARLY_ACCESS_OFFER}</strong>.
              </p>
              <ul className="relative mt-6 space-y-3">
                {PRO.map((f) => (
                  <li key={f} className="flex gap-3">
                    <span className="mt-0.5 text-accent">
                      <Check muted />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#waitlist"
                className="relative mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-accent font-display font-bold text-accent-ink transition hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98]"
              >
                Claim {EARLY_ACCESS_OFFER}
              </a>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
