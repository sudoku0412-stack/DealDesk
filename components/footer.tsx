import Link from "next/link";
import { APP_NAME, PARENT_BRAND, PARENT_URL } from "@/lib/config";
import { Logo } from "@/components/nav";

export function Footer() {
  return (
    <footer className="border-t border-line px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-sm text-muted md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Logo className="text-fg" />
          <p>
            A{" "}
            <a href={PARENT_URL} className="font-semibold text-fg underline-offset-4 hover:underline">
              {PARENT_BRAND}
            </a>{" "}
            product
          </p>
        </div>
        <nav aria-label="Legal" className="flex gap-6 font-medium">
          <Link href="/privacy" className="hover:text-fg">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-fg">
            Terms of Service
          </Link>
        </nav>
        <p>
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
