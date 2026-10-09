import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/app/settings-form";
import type { Profile } from "@/lib/app/types";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").single<Profile>();
  if (!profile) return <p className="text-muted">Profile not found. Sign out and back in.</p>;
  return <SettingsForm profile={profile} />;
}
