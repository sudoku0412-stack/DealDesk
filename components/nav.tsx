"use client";

import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/config";
import { ThemeToggle } from "@/components/theme-toggle";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-extrabold tracking-tight ${className}`}>
      <span className="grid size-8 place-items-center rounded-lg bg-fg text-bg" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M4 12h10M4 17h6" />
        </svg>
      </span>
      <span>
        {APP_NAME}
        <span className="text-accent">.</span>
      </span>
    </span>
  );
}

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-line bg-bg/80 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" aria-label={`${APP_NAME} home`}>
          <Logo />
        </a>
        <ul className="hidden items-center gap-8 text-sm font-medium md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-muted transition hover:text-fg">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="#waitlist"
            className="inline-flex h-10 items-center rounded-full bg-fg px-5 text-sm font-bold text-bg transition hover:-translate-y-0.5 hover:opacity-90 active:scale-95"
          >
            Join waitlist
          </a>
        </div>
      </nav>
    </header>
  );
}
