import { NextResponse } from "next/server";
import { createClient, authConfigured } from "@/lib/supabase/server";
import { csvResponse, toCsv } from "@/lib/csv";
import { todayIn } from "@/lib/app/format";
import type { Profile } from "@/lib/app/types";

export const dynamic = "force-dynamic";

type Row = { label: string; amount_cents: number; invoiced_on: string | null; due_on: string | null; paid_on: string | null; deals: { brand: string } | null };

/** The signed-in user's payments as CSV. */
export async function GET() {
  if (!authConfigured()) return new NextResponse("Not configured", { status: 503 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const [pays, profile] = await Promise.all([
    supabase.from("payments").select("label,amount_cents,invoiced_on,due_on,paid_on,deals(brand)").order("due_on", { ascending: true, nullsFirst: false }).returns<Row[]>(),
    supabase.from("profiles").select("currency,timezone").single<Pick<Profile, "currency" | "timezone">>(),
  ]);
  if (pays.error) return new NextResponse("Could not export.", { status: 500 });

  const today = todayIn(profile.data?.timezone);
  const cur = profile.data?.currency ?? "USD";

  const rows = (pays.data ?? []).map((p) => [
    p.deals?.brand ?? "",
    p.label,
    (p.amount_cents / 100).toFixed(2),
    cur,
    p.invoiced_on,
    p.due_on,
    p.paid_on,
    p.paid_on ? "paid" : p.due_on && p.due_on < today ? "overdue" : "unpaid",
  ]);

  return csvResponse(toCsv(["brand", "payment", "amount", "currency", "invoiced_on", "due_on", "paid_on", "status"], rows), "dealdesk-payments");
}
