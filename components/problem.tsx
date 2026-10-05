import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

const PROBLEMS = [
  {
    title: "Deals buried in DMs",
    body: "The brief is in Instagram, the rate in email, the usage rights in a voice note. Finding it later means scrolling for an hour.",
    visual: (
      <div className="space-y-2 text-[13px]" aria-hidden="true">
        <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-fg/8 px-3 py-2">Hey! Sent the contract over Thursday, did you see it? 🙈</p>
        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 font-medium text-accent-ink">
          Which thread was this in…
        </p>
      </div>
    ),
  },
  {
    title: "Deadlines that sneak up",
    body: "Posting dates, draft approvals and usage windows live in your head. One missed slot and a brand relationship takes the hit.",
    visual: (
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-solid px-3 py-2.5 text-[13px]" aria-hidden="true">
        <span className="grid size-9 place-items-center rounded-lg bg-amber/25 font-display font-bold text-[#8a5d00] dark:text-amber">1d</span>
        <div>
          <p className="font-semibold">Draft due: Brewline</p>
          <p className="text-muted">Nobody reminded you.</p>
        </div>
      </div>
    ),
  },
  {
    title: "Payments that go quiet",
    body: "Net-30 turns into net-90 when nobody is counting. Chasing money is awkward, so it slides, and your rent doesn't.",
    visual: (
      <div className="flex items-center justify-between rounded-2xl border border-line bg-surface-solid px-3 py-2.5 text-[13px]" aria-hidden="true">
        <div>
          <p className="font-semibold">Nova Skincare</p>
          <p className="text-muted">$1,800 · invoiced 47 days ago</p>
        </div>
        <span className="rounded-md bg-[#ff4d3a]/15 px-2 py-1 text-[11px] font-bold text-[#b3200f] dark:text-[#ff8a7a]">Overdue</span>
      </div>
    ),
  },
];

export function Problem() {
  return (
    <section aria-labelledby="problem-title" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="The problem" title="Sponsorships are great. The admin is not." id="problem-title">
          Most small creators run brand deals out of a notes app, a spreadsheet and sheer memory. It works, until it doesn&apos;t.
        </SectionHeading>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <article className="glass flex h-full flex-col rounded-3xl p-6 transition hover:-translate-y-1">
                <div className="mb-6 flex min-h-[88px] flex-col justify-center">{p.visual}</div>
                <h3 className="text-2xl font-bold">{p.title}</h3>
                <p className="mt-2 text-muted">{p.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
