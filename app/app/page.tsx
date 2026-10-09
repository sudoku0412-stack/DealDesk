import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Board } from "@/components/app/board";
import { todayISO } from "@/lib/app/format";
import type { Deal, Deliverable, Payment, Profile } from "@/lib/app/types";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const supabase = await createClient();
  const [deals, deliverables, payments, profile] = await Promise.all([
    supabase.from("deals").select("*").eq("archived", false).order("created_at", { ascending: false }).returns<Deal[]>(),
    supabase.from("deliverables").select("id,deal_id,title,due_date,done").eq("done", false).returns<Deliverable[]>(),
    supabase.from("payments").select("*").is("paid_on", null).returns<Payment[]>(),
    supabase.from("profiles").select("currency,plan").single<Pick<Profile, "currency" | "plan">>(),
  ]);

  return (
    <Board
      initialDeals={deals.data ?? []}
      deliverables={deliverables.data ?? []}
      payments={payments.data ?? []}
      currency={profile.data?.currency ?? "USD"}
      plan={profile.data?.plan ?? "free"}
      today={todayISO()}
    />
  );
}
