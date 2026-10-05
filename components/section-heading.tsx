import { Reveal } from "@/components/reveal";

export function SectionHeading({
  eyebrow,
  title,
  children,
  id,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  id?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-accent-text">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-balance text-4xl font-extrabold leading-tight sm:text-5xl">
        {title}
      </h2>
      {children && <p className="mt-4 text-pretty text-lg text-muted">{children}</p>}
    </Reveal>
  );
}
