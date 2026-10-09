import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DealEditor } from "@/components/app/deal-editor";
import { todayISO } from "@/lib/app/format";
import type { Deal, Deliverable, Payment, Profile } from "@/lib/app/types";

export const metadata: Metadata = { title: "Deal" };

export default async function DealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const [deal, deliverables, payments, profile] = await Promise.all([
    supabase.from("deals").select("*").eq("id", id).maybeSingle<Deal>(),
    supabase.from("deliverables").select("id,deal_id,title,due_date,done").eq("deal_id", id).order("due_date", { ascending: true, nullsFirst: false }).returns<Deliverable[]>(),
    supabase.from("payments").select("*").eq("deal_id", id).order("created_at").returns<Payment[]>(),
    supabase.from("profiles").select("currency").single<Pick<Profile, "currency">>(),
  ]);
  if (!deal.data) notFound();

  return (
    <DealEditor
      deal={deal.data}
      initialDeliverables={deliverables.data ?? []}
      initialPayments={payments.data ?? []}
      currency={profile.data?.currency ?? "USD"}
      today={todayISO()}
    />
  );
}
