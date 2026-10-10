/** Quote a CSV cell and defuse spreadsheet formula injection (=, +, -, @ at the start). */
export function csvCell(value: string | number | boolean | null | undefined) {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(header: string[], rows: (string | number | boolean | null | undefined)[][]) {
  return [header.join(","), ...rows.map((r) => r.map(csvCell).join(","))].join("\n");
}

export function csvResponse(body: string, filename: string) {
  return new Response(`﻿${body}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
