/**
 * Small in-memory sliding-window rate limiter.
 *
 * Good enough to blunt casual abuse on a single serverless instance. State is
 * per-instance, so for strict limits swap this for a shared store (e.g. Upstash
 * Redis) behind the same `rateLimit` signature.
 */
type Bucket = number[];

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

export function rateLimit(key: string, limit = 5, windowMs = 10 * 60 * 1000): RateLimitResult {
  const now = Date.now();

  if (now - lastSweep > windowMs) {
    lastSweep = now;
    for (const [k, hits] of buckets) {
      if (hits.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }

  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterSeconds: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }

  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterSeconds: 0 };
}
