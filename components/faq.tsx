import { APP_NAME, EARLY_ACCESS_OFFER, FREE_DEAL_LIMIT } from "@/lib/config";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

export const FAQS = [
  {
    q: `Is ${APP_NAME} really free?`,
    a: `Yes. The free plan covers up to ${FREE_DEAL_LIMIT} active deals at a time with the full pipeline, reminders, payment tracking and rate card. A paid Pro plan for unlimited deals is coming later.`,
  },
  {
    q: "What counts as an active deal?",
    a: "Any deal that is not yet marked Paid or closed. Once a deal is paid, it stops counting, so your free slots open back up.",
  },
  {
    q: `What do I get for joining the waitlist?`,
    a: `Early-access members get ${EARLY_ACCESS_OFFER} on Pro, locked in for as long as you stay subscribed, plus an invite before public launch. You also get your place in line.`,
  },
  {
    q: "Who is it for?",
    a: "Solo and small creators on YouTube, TikTok, Instagram, Twitch and beyond who juggle sponsorships without an agent or a manager.",
  },
  {
    q: `Does ${APP_NAME} send invoices or process payments?`,
    a: `No. ${APP_NAME} tracks what you're owed, when it's due and what's overdue, so you can follow up. You keep invoicing and getting paid the way you already do.`,
  },
  {
    q: "When does it launch?",
    a: "We're building now and inviting people in waves, in waitlist order. We'll email you once when your spot is ready.",
  },
  {
    q: "What happens to my email?",
    a: "We use it to confirm your spot and to send your invite. No spam and no selling your data. See our privacy policy for details.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions, answered." id="faq-title" />
        <Reveal className="mt-12 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold">
                {f.q}
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full border border-line transition group-open:rotate-45 group-open:bg-accent group-open:text-accent-ink"
                  aria-hidden="true"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 max-w-prose text-muted">{f.a}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
