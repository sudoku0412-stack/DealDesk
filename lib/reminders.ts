import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { APP_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/config";
import { addDays, formatMoney, hourIn, todayIn } from "@/lib/app/format";

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type Line = { kind: "deliverable" | "deliverable_overdue" | "payment_overdue"; ref: string; text: string };

type Candidate = { id: string; email: string; display_name: string | null; currency: string; timezone: string; reminder_hour: number; reminder_lead_days: number };

/**
 * Runs every hour. Each person gets at most one digest a day, sent in the hour they chose in their own
 * time zone, only when there is something to report:
 *  - deliverables due within their lead time (once) and overdue deliverables (once);
 *  - overdue payments (repeated at most every 7 days).
 */
export async function runReminders(now = new Date()) {
  const db = getSupabase();
  const apiKey = process.env.RESEND_API_KEY;
  if (!db || !apiKey) return { ok: false as const, error: "not configured" };

  const { data: all, error: pErr } = await db
    .from("profiles")
    .select("id,email,display_name,currency,timezone,reminder_hour,reminder_lead_days")
    .eq("reminders_enabled", true)
    .returns<Candidate[]>();
  if (pErr) {
    console.error("[reminders] profiles query failed:", pErr.message);
    return { ok: false as const, error: "query failed" };
  }

  const due = (all ?? []).filter((p) => hourIn(p.timezone, now) === p.reminder_hour);
  if (due.length === 0) return { ok: true as const, users: 0, emails: 0, failures: 0 };

  const ids = due.map((p) => p.id);
  const utcToday = now.toISOString().slice(0, 10);

  const [dels, pays, sent] = await Promise.all([
    db.from("deliverables").select("id,user_id,title,due_date,deals(brand)").in("user_id", ids).eq("done", false).not("due_date", "is", null).lte("due_date", addDays(utcToday, 16)),
    db.from("payments").select("id,user_id,label,amount_cents,due_on,deals(brand)").in("user_id", ids).is("paid_on", null).not("due_on", "is", null).lte("due_on", addDays(utcToday, 1)),
    db.from("reminders_sent").select("kind,ref_id,sent_on").in("user_id", ids).gte("sent_on", addDays(utcToday, -400)),
  ]);
  if (dels.error || pays.error || sent.error) {
    console.error("[reminders] query failed:", dels.error?.message ?? pays.error?.message ?? sent.error?.message);
    return { ok: false as const, error: "query failed" };
  }

  const lastSent = new Map<string, string>();
  for (const s of sent.data ?? []) {
    const key = `${s.kind}:${s.ref_id}`;
    if (!lastSent.has(key) || s.sent_on > lastSent.get(key)!) lastSent.set(key, s.sent_on);
  }
  const brandOf = (r: { deals: unknown }) => (r.deals as { brand?: string } | null)?.brand ?? "a deal";

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || `${APP_NAME} <${SUPPORT_EMAIL}>`;
  let emails = 0;
  const failures: string[] = [];

  for (const user of due) {
    const today = todayIn(user.timezone, now);
    const soon = addDays(today, user.reminder_lead_days);
    const weekAgo = addDays(today, -7);
    const lines: Line[] = [];

    for (const d of (dels.data ?? []).filter((x) => x.user_id === user.id)) {
      const overdue = d.due_date! < today;
      if (!overdue && d.due_date! > soon) continue;
      const kind = overdue ? "deliverable_overdue" : "deliverable";
      if (lastSent.has(`${kind}:${d.id}`)) continue;
      const when = overdue ? `was due ${d.due_date}` : d.due_date === today ? "is due today" : `is due ${d.due_date}`;
      lines.push({ kind, ref: d.id, text: `${overdue ? "⚠ " : "⏰ "}${d.title} for ${brandOf(d)} ${when}` });
    }
    for (const p of (pays.data ?? []).filter((x) => x.user_id === user.id)) {
      if (p.due_on! >= today) continue;
      const prev = lastSent.get(`payment_overdue:${p.id}`);
      if (prev && prev > weekAgo) continue;
      lines.push({ kind: "payment_overdue", ref: p.id, text: `💸 ${brandOf(p)}: ${p.label} (${formatMoney(p.amount_cents, user.currency)}) was due ${p.due_on}` });
    }
    if (lines.length === 0) continue;

    const items = lines.map((l) => `<li style="margin:8px 0;">${esc(l.text)}</li>`).join("");
    const html = `<!doctype html><html><body style="margin:0;background:#f7f2e8;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#15171e;"><div style="max-width:560px;margin:0 auto;padding:32px 16px;"><div style="background:#fffdf8;border:1px solid #e6dfcf;border-radius:20px;padding:28px 32px;"><div style="font-size:20px;font-weight:800;">${esc(APP_NAME)}<span style="color:#ff5a1f;">.</span></div><h1 style="font-size:24px;margin:16px 0 4px;">Heads up${user.display_name ? `, ${esc(user.display_name)}` : ""}</h1><p style="color:#454a57;margin:0 0 8px;">${lines.length === 1 ? "One thing needs" : `${lines.length} things need`} your attention:</p><ul style="padding-left:20px;line-height:1.5;">${items}</ul><p style="margin:20px 0 0;"><a href="${esc(SITE_URL)}/app" style="background:#ff5a1f;color:#15171e;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:12px;display:inline-block;">Open ${esc(APP_NAME)}</a></p><p style="font-size:12px;color:#6b7080;margin:24px 0 0;">Change when you get these, or turn them off, in <a href="${esc(SITE_URL)}/app/settings" style="color:#6b7080;">Settings</a>.</p></div></div></body></html>`;

    const { error } = await resend.emails.send({
      from,
      to: user.email,
      replyTo: SUPPORT_EMAIL,
      subject: `${APP_NAME}: ${lines.length} ${lines.length === 1 ? "reminder" : "reminders"}`,
      html,
      text: `${lines.map((l) => l.text).join("\n")}\n\nOpen ${APP_NAME}: ${SITE_URL}/app`,
    });
    if (error) {
      failures.push(`${user.id}: ${error.message}`);
      continue;
    }
    emails++;
    await db.from("reminders_sent").insert(lines.map((l) => ({ user_id: user.id, kind: l.kind, ref_id: l.ref, sent_on: today })));
  }

  if (failures.length) console.error("[reminders] send failures:", failures.join("; "));
  return { ok: true as const, users: due.length, emails, failures: failures.length };
}
