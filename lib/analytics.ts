type PlausibleFn = (event: string, options?: { props?: Record<string, string | number | boolean> }) => void;

/**
 * Fire a custom analytics event (Plausible). No-ops if the Plausible script is
 * not loaded (see NEXT_PUBLIC_PLAUSIBLE_DOMAIN). Never throws.
 */
export function trackEvent(name: string, props?: Record<string, string | number | boolean>) {
  try {
    const plausible = (window as unknown as { plausible?: PlausibleFn }).plausible;
    plausible?.(name, props ? { props } : undefined);
  } catch {
    /* analytics must never break the UI */
  }
}
