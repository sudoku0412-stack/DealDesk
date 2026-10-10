import Link from "next/link";
import { APP_NAME } from "@/lib/config";
import { Logo } from "@/components/nav";
import { Footer } from "@/components/footer";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-line px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" aria-label={`${APP_NAME} home`}>
            <Logo />
          </Link>
          <Link href="/" className="text-sm font-semibold text-muted hover:text-fg">
            ← Back to home
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-muted">Last updated: {updated}</p>
        <div className="legal mt-8 space-y-4 text-base leading-relaxed text-muted [&_a]:font-semibold [&_a]:text-fg [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-fg [&_li]:mt-1.5 [&_strong]:text-fg [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
