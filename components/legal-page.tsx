import Link from "next/link";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/config";
import { Logo } from "@/components/nav";
import { Footer } from "@/components/footer";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
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
        <p className="mt-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          This is a placeholder page. Final legal text will be published before launch. Questions in the meantime? Email{" "}
          <a className="font-semibold text-fg underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <div className="mt-8 space-y-4 text-lg leading-relaxed text-muted [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-fg">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
