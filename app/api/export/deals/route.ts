import { NextResponse } from "next/server";
import { createClient, authConfigured } from "@/lib/supabase/server";
import { csvResponse, toCsv } from "@/lib/csv";
import type { Deal, Deliverable, Payment, Profile } from "@/lib/app/types";

export const dynamic = "force-dynamic";

/** The signed-in user's deals as CSV. Row level security limits every query to their own data. */
export async function GET() {
  if (!authConfigured()) return new NextResponse("Not configured", { status: 503 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const [deals, dels, pays, profile] = await Promise.all([
    supabase.from("deals").select("*").order("created_at", { ascending: false }).returns<Deal[]>(),
    supabase.from("deliverables").select("deal_id,done,due_date").returns<Pick<Deliverable, "deal_id" | "done" | "due_date">[]>(),
    supabase.from("payments").select("deal_id,amount_cents,paid_on").returns<Pick<Payment, "deal_id" | "amount_cents" | "paid_on">[]>(),
    supabase.from("profiles").select("currency").single<Pick<Profile, "currency">>(),
  ]);
  if (deals.error) return new NextResponse("Could not export.", { status: 500 });

  const cur = profile.data?.currency ?? "USD";
  const money = (c: number) => (c / 100).toFixed(2);

  const rows = (deals.data ?? []).map((d) => {
    const dl = (dels.data ?? []).filter((x) => x.deal_id === d.id);
    const py = (pays.data ?? []).filter((x) => x.deal_id === d.id);
    const next = dl.filter((x) => !x.done && x.due_date).map((x) => x.due_date!).sort()[0] ?? "";
    const paid = py.filter((x) => x.paid_on).reduce((a, x) => a + x.amount_cents, 0);
    const owed = py.filter((x) => !x.paid_on).reduce((a, x) => a + x.amount_cents, 0);
    return [d.brand, d.stage, d.archived ? "yes" : "no", d.platform, money(d.amount_cents), cur, d.contact_name, d.contact_email, dl.length, dl.filter((x) => x.done).length, next, money(paid), money(owed), d.created_at.slice(0, 10), d.notes];
  });

  return csvResponse(
    toCsv(["brand", "stage", "archived", "platform", "deal_value", "currency", "contact_name", "contact_email", "deliverables", "deliverables_done", "next_deadline", "paid", "outstanding", "created", "notes"], rows),
    "dealdesk-deals",
  );
}
