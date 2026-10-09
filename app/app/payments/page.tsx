import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PaymentList, type PaymentRow } from "@/components/app/payment-list";
import { todayISO } from "@/lib/app/format";
import type { Profile } from "@/lib/app/types";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const supabase = await createClient();
  const [payments, profile] = await Promise.all([
    supabase.from("payments").select("id,deal_id,label,amount_cents,invoiced_on,due_on,paid_on,deals(brand)").order("due_on", { ascending: true, nullsFirst: false })
      .returns<(Omit<PaymentRow, "brand"> & { deals: { brand: string } | null })[]>(),
    supabase.from("profiles").select("currency").single<Pick<Profile, "currency">>(),
  ]);
  const rows: PaymentRow[] = (payments.data ?? []).map(({ deals, ...p }) => ({ ...p, brand: deals?.brand ?? "" }));
  return <PaymentList initial={rows} currency={profile.data?.currency ?? "USD"} today={todayISO()} />;
}
