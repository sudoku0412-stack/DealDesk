"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Sends one anonymous page view per navigation. Respects Do Not Track. No cookies. */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || navigator.doNotTrack === "1") return;

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("utm_source") || params.get("ref") || document.referrer;

    fetch("/api/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, ref }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
