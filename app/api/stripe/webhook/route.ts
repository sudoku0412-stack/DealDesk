import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Subscription states that keep Pro access (past_due gets a grace period while Stripe retries the card). */
const PRO_STATUSES = new Set(["active", "trialing", "past_due"]);

function periodEnd(sub: Stripe.Subscription) {
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const ts = item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const admin = getSupabase();
  if (!stripe || !secret || !admin) return new NextResponse("Not configured", { status: 503 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secret, undefined, Stripe.createSubtleCryptoProvider());
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.client_reference_id;
      if (userId && typeof s.customer === "string") {
        await admin.from("profiles").update({ stripe_customer_id: s.customer, stripe_subscription_id: typeof s.subscription === "string" ? s.subscription : null }).eq("id", userId);
      }
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const isPro = event.type !== "customer.subscription.deleted" && PRO_STATUSES.has(sub.status);

      const patch = {
        plan: isPro ? "pro" : "free",
        plan_status: sub.status,
        plan_period_end: periodEnd(sub),
        stripe_subscription_id: sub.id,
        stripe_customer_id: customer,
      };
      const userId = sub.metadata?.user_id;
      const { data, error } = userId
        ? await admin.from("profiles").update(patch).eq("id", userId).select("id")
        : await admin.from("profiles").update(patch).eq("stripe_customer_id", customer).select("id");
      if (error) throw new Error(error.message);
      if (!data?.length) console.error("[stripe] no profile for subscription", sub.id);
    }
  } catch (err) {
    console.error("[stripe] webhook handling failed:", err instanceof Error ? err.message : err);
    return new NextResponse("Handler error", { status: 500 }); // Stripe retries
  }

  return NextResponse.json({ received: true });
}
