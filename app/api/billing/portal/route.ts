import { NextResponse } from "next/server";
import { createClient, authConfigured } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase";
import { getStripe } from "@/lib/billing";
import { SITE_URL } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Opens the Stripe customer portal (change card, cancel, view invoices). */
export async function POST() {
  const stripe = getStripe();
  const admin = getSupabase();
  if (!authConfigured() || !stripe || !admin) return json({ error: "Billing is not available yet." }, 503);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: "Please sign in again." }, 401);

  const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("id", user.id).single<{ stripe_customer_id: string | null }>();
  if (!profile?.stripe_customer_id) return json({ error: "No billing account yet." }, 404);

  try {
    const session = await stripe.billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${SITE_URL}/app/settings` });
    return json({ url: session.url });
  } catch (err) {
    console.error("[billing] portal failed:", err instanceof Error ? err.message : err);
    return json({ error: "Could not open billing. Please try again." }, 500);
  }
}
