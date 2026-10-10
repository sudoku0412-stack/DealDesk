import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/app/settings-form";
import { billingConfigured } from "@/lib/billing";
import type { DealTemplate, Profile } from "@/lib/app/types";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ billing?: string }> }) {
  const { billing } = await searchParams;
  const supabase = await createClient();
  const [{ data: profile }, templates] = await Promise.all([
    supabase.from("profiles").select("*").single<Profile>(),
    supabase.from("deal_templates").select("id,name,platform,amount_cents,deliverables,payments,notes").order("name").returns<DealTemplate[]>(),
  ]);
  if (!profile) return <p className="text-muted">Profile not found. Sign out and back in.</p>;
  return <SettingsForm profile={profile} templates={templates.data ?? []} billingEnabled={billingConfigured()} billingResult={billing} />;
}
