import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { fetchSignups } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

/** Guards against CSV/formula injection when opened in Excel or Sheets. */
function cell(value: string | number) {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });

  const { rows, error } = await fetchSignups();
  if (error) return new NextResponse("Could not load signups.", { status: 500 });

  const lines = ["position,email,platform,joined_utc", ...rows.map((r) => [r.position, r.email, r.platform, r.created_at].map(cell).join(","))];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dealdesk-waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
