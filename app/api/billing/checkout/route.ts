import { NextResponse } from "next/server";
import { createClient, authConfigured } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase";
import { billingConfigured, getStripe } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Starts a Stripe Checkout session for the Pro plan. Waitlist members get the early-access coupon automatically. */
export async function POST() {
  const stripe = getStripe();
  const admin = getSupabase();
  if (!authConfigured() || !stripe || !admin || !billingConfigured()) return json({ error: "Billing is not available yet." }, 503);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Please sign in again." }, 401);
  if (!rateLimit(`checkout:${user.id}`, 10, 10 * 60 * 1000).ok) return json({ error: "Too many attempts. Try again shortly." }, 429);

  const { data: profile } = await admin
    .from("profiles")
    .select("email,plan,stripe_customer_id")
    .eq("id", user.id)
    .single<{ email: string; plan: string; stripe_customer_id: string | null }>();
  if (!profile) return json({ error: "Profile not found." }, 404);
  if (profile.plan === "pro") return json({ error: "You are already on Pro." }, 409);

  try {
    let customer = profile.stripe_customer_id;
    if (!customer) {
      const created = await stripe.customers.create({ email: profile.email, metadata: { user_id: user.id } });
      customer = created.id;
      await admin.from("profiles").update({ stripe_customer_id: customer }).eq("id", user.id);
    }

    const { count } = await admin.from("waitlist").select("id", { head: true, count: "exact" }).eq("email", profile.email.toLowerCase());
    const coupon = process.env.STRIPE_WAITLIST_COUPON_ID;
    const earlyAccess = !!count && !!coupon;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      client_reference_id: user.id,
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      ...(earlyAccess ? { discounts: [{ coupon: coupon! }] } : { allow_promotion_codes: true }),
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${SITE_URL}/app/settings?billing=success`,
      cancel_url: `${SITE_URL}/app/settings?billing=cancelled`,
    });
    if (!session.url) return json({ error: "Could not start checkout." }, 500);
    return json({ url: session.url });
  } catch (err) {
    console.error("[billing] checkout failed:", err instanceof Error ? err.message : err);
    return json({ error: "Could not start checkout. Please try again." }, 500);
  }
}
