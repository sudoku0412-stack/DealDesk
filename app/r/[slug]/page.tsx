import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/app/format";
import { APP_NAME, PARENT_BRAND, SITE_URL } from "@/lib/config";
import type { Profile, RateItem } from "@/lib/app/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rate card", robots: { index: false, follow: false } };

export default async function PublicRateCard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = getSupabase();
  if (!admin || !/^[a-z0-9]{6,20}$/.test(slug)) notFound();

  const { data: profile } = await admin
    .from("profiles")
    .select("id,email,display_name,currency,rate_card_intro")
    .eq("public_slug", slug)
    .eq("rate_card_public", true)
    .maybeSingle<Pick<Profile, "id" | "email" | "display_name" | "currency" | "rate_card_intro">>();
  if (!profile) notFound();

  const { data: items } = await admin
    .from("rate_card_items")
    .select("id,label,description,price_cents")
    .eq("user_id", profile.id)
    .order("sort")
    .order("created_at")
    .returns<Pick<RateItem, "id" | "label" | "description" | "price_cents">[]>();

  const name = profile.display_name || "Creator";

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-accent-text">Rate card</p>
      <h1 className="mt-2 text-4xl font-extrabold">{name}</h1>
      {profile.rate_card_intro && <p className="mt-3 text-lg text-muted">{profile.rate_card_intro}</p>}

      <ul className="glass mt-8 divide-y divide-line/60 rounded-3xl">
        {(items ?? []).map((i) => (
          <li key={i.id} className="flex items-start justify-between gap-4 px-6 py-4">
            <div>
              <p className="font-display text-lg font-bold">{i.label}</p>
              {i.description && <p className="text-sm text-muted">{i.description}</p>}
            </div>
            <p className="font-display text-xl font-extrabold tabular-nums text-accent-text">{formatMoney(i.price_cents, profile.currency)}</p>
          </li>
        ))}
        {(items ?? []).length === 0 && <li className="px-6 py-8 text-center text-muted">No rates published yet.</li>}
      </ul>

      <a href={`mailto:${profile.email}?subject=${encodeURIComponent(`Partnership with ${name}`)}`} className="mt-8 inline-flex h-12 items-center rounded-xl bg-accent px-6 font-display font-bold text-accent-ink">
        Get in touch
      </a>

      <p className="mt-12 text-xs text-muted">
        Made with <a href={SITE_URL} className="font-semibold underline">{APP_NAME}</a>, a {PARENT_BRAND} product.
      </p>
    </main>
  );
}
