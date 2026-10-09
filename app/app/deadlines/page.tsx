import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { DeadlineList, type DeadlineRow } from "@/components/app/deadline-list";
import { todayISO } from "@/lib/app/format";

export const metadata: Metadata = { title: "Deadlines" };

export default async function DeadlinesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deliverables")
    .select("id,deal_id,title,due_date,done,deals(brand)")
    .order("due_date", { ascending: true, nullsFirst: false })
    .returns<(Omit<DeadlineRow, "brand"> & { deals: { brand: string } | null })[]>();

  const rows: DeadlineRow[] = (data ?? []).map(({ deals, ...r }) => ({ ...r, brand: deals?.brand ?? "" }));
  return <DeadlineList initial={rows} today={todayISO()} />;
}
