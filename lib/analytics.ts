import { track } from "@vercel/analytics";

/** Fire a custom analytics event. Never throws; analytics must not break the UI. */
export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  try {
    track(name, props);
  } catch {
    /* ignore */
  }
}
