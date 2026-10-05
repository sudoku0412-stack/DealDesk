import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

const STEPS = [
  {
    n: "01",
    title: "Add the deal",
    body: "Brand, amount, deliverables and dates. Thirty seconds, straight from the DM.",
  },
  {
    n: "02",
    title: "Move it forward",
    body: "Drag it through the pipeline. DealDesk reminds you before every deadline so nothing slips.",
  },
  {
    n: "03",
    title: "Get paid",
    body: "Mark it invoiced. If the due date passes, you get an overdue alert and know exactly who to nudge.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="How it works" title="From first DM to money in the bank." id="how-title">
          Three steps. No setup call, no onboarding deck.
        </SectionHeading>

        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.n}>
              <Reveal delay={i * 0.1} className="h-full">
                <div className="glass relative h-full overflow-hidden rounded-3xl p-7">
                  <span
                    className="absolute -right-2 -top-6 font-display text-[7rem] font-extrabold leading-none text-accent/15"
                    aria-hidden="true"
                  >
                    {s.n}
                  </span>
                  <p className="relative text-sm font-bold uppercase tracking-[0.14em] text-accent-text">Step {s.n}</p>
                  <h3 className="relative mt-3 text-2xl font-bold">{s.title}</h3>
                  <p className="relative mt-2 text-muted">{s.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
