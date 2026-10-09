import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { RateCardEditor } from "@/components/app/rate-card-editor";
import { SITE_URL } from "@/lib/config";
import type { Profile, RateItem } from "@/lib/app/types";

export const metadata: Metadata = { title: "Rate card" };

export default async function RateCardPage() {
  const supabase = await createClient();
  const [items, profile] = await Promise.all([
    supabase.from("rate_card_items").select("id,label,description,price_cents,sort").order("sort").order("created_at").returns<RateItem[]>(),
    supabase.from("profiles").select("*").single<Profile>(),
  ]);
  if (!profile.data) return <p className="text-muted">Profile not found. Sign out and back in.</p>;
  return <RateCardEditor initialItems={items.data ?? []} profile={profile.data} siteUrl={SITE_URL} />;
}
