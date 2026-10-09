"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/app", label: "Pipeline", icon: "M4 5h4v14H4zM10 5h4v9h-4zM16 5h4v6h-4z" },
  { href: "/app/deadlines", label: "Deadlines", icon: "M12 7v5l3 2M12 3a9 9 0 100 18 9 9 0 000-18z" },
  { href: "/app/payments", label: "Payments", icon: "M3 7h18v10H3zM3 11h18M7 15h3" },
  { href: "/app/rate-card", label: "Rate card", icon: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" },
  { href: "/app/settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12h2M3 12h2M12 3v2M12 19v2" },
];

export function AppNav({ orientation }: { orientation: "side" | "bottom" }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/app" ? pathname === "/app" || pathname.startsWith("/app/deals") : pathname.startsWith(href));

  return (
    <ul className={orientation === "side" ? "mt-6 space-y-1" : "grid grid-cols-5 gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1"}>
      {ITEMS.map((i) => (
        <li key={i.href}>
          <Link
            href={i.href}
            aria-current={active(i.href) ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl text-sm font-semibold transition ${
              orientation === "side" ? "px-3 py-2.5" : "flex-col gap-1 px-1 py-2.5 text-[11px]"
            } ${active(i.href) ? "bg-fg text-bg" : "text-muted hover:bg-surface hover:text-fg"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={i.icon} />
            </svg>
            {i.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
