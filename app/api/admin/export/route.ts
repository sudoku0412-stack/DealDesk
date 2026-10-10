import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { fetchSignups } from "@/lib/admin-data";
import { csvResponse, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });

  const { rows, error } = await fetchSignups();
  if (error) return new NextResponse("Could not load signups.", { status: 500 });

  return csvResponse(toCsv(["position", "email", "platform", "joined_utc"], rows.map((r) => [r.position, r.email, r.platform, r.created_at])), "dealdesk-waitlist");
}
