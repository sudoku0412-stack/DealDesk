import { EARLY_ACCESS_OFFER } from "@/lib/config";
import { WaitlistForm } from "@/components/waitlist-form";
import { PipelineMockup } from "@/components/pipeline-mockup";
import { Reveal } from "@/components/reveal";

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pb-20 pt-32 sm:pt-40">
      <div className="hero-glow absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_65%,transparent)]" aria-hidden="true" />
      <div
        className="dot-grid absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <Reveal y={12}>
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-semibold backdrop-blur">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            Early access: {EARLY_ACCESS_OFFER}
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
            Stop losing track of your <span className="text-gradient">brand deals.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.12}>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted sm:text-xl">
            DealDesk is the CRM for small creators. Follow every sponsorship from pitch to paid, get deadline reminders,
            and chase late payments before they chase you.
          </p>
        </Reveal>

        <Reveal delay={0.2} className="relative mt-9" >
          <div id="waitlist" className="scroll-mt-28">
            <WaitlistForm source="hero" />
          </div>
        </Reveal>

        <Reveal delay={0.3} y={40} className="relative mt-16">
          <div className="pointer-events-none absolute left-0 top-12 z-20 hidden xl:block" aria-hidden="true">
            <div className="glass animate-float rounded-2xl px-4 py-3 text-left text-sm">
              <p className="font-display font-bold">⏰ Deliverable due tomorrow</p>
              <p className="text-xs text-muted">Brewline · Twitch stream</p>
            </div>
          </div>
          <div className="pointer-events-none absolute right-0 bottom-20 z-20 hidden xl:block" aria-hidden="true">
            <div className="glass animate-float rounded-2xl px-4 py-3 text-left text-sm [animation-delay:-3s]">
              <p className="font-display font-bold text-[#c0270a] dark:text-[#ff8a7a]">⚠ Invoice 4 days overdue</p>
              <p className="text-xs text-muted">Nova Skincare · $1,800</p>
            </div>
          </div>
          <PipelineMockup />
        </Reveal>
      </div>
    </section>
  );
}
