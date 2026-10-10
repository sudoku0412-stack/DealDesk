import Stripe from "stripe";

/** True once the Stripe secret key and Pro price are set. Until then the app shows no upgrade button. */
export function billingConfigured() {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_ID;
}

/** Stripe client that works on Cloudflare Workers (uses fetch and Web Crypto instead of Node http). */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}
