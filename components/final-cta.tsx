import { EARLY_ACCESS_OFFER } from "@/lib/config";
import { Reveal } from "@/components/reveal";
import { WaitlistForm } from "@/components/waitlist-form";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="px-4 pb-24 pt-8 sm:px-6">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#0f1118] px-6 py-16 text-center text-white sm:px-12">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 80% at 85% 0%, rgb(255 90 31 / 0.55), transparent 70%), radial-gradient(50% 70% at 5% 100%, rgb(124 92 255 / 0.4), transparent 70%)",
            }}
            aria-hidden="true"
          />
          <div className="dot-grid absolute inset-0 opacity-30 invert" aria-hidden="true" />
          <div className="relative">
            <h2 id="cta-title" className="mx-auto max-w-2xl text-balance text-4xl font-extrabold leading-tight sm:text-5xl">
              Your next brand deal deserves a better home.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
              Join the waitlist and lock in {EARLY_ACCESS_OFFER} when Pro launches.
            </p>
            <div className="mt-8">
              <WaitlistForm source="final-cta" tone="inverted" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
