import { Resend } from "resend";
import { getSupabase } from "@/lib/supabase";
import { APP_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/config";
import { formatMoney } from "@/lib/app/format";

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => isoDay(new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000));

type Line = { kind: "deliverable" | "deliverable_overdue" | "payment_overdue"; ref: string; text: string };

/**
 * Daily digest. Deliverables: one email once when due within 2 days, and once when overdue.
 * Payments: overdue ones are re-sent at most every 7 days. One digest email per user.
 */
export async function runReminders(now = new Date()) {
  const db = getSupabase();
  const apiKey = process.env.RESEND_API_KEY;
  if (!db || !apiKey) return { ok: false as const, error: "not configured" };

  const today = isoDay(now);
  const soon = addDays(today, 2);
  const weekAgo = addDays(today, -7);

  const [dels, pays, sent] = await Promise.all([
    db.from("deliverables").select("id,user_id,title,due_date,deal_id,deals(brand)").eq("done", false).not("due_date", "is", null).lte("due_date", soon),
    db.from("payments").select("id,user_id,label,amount_cents,due_on,deals(brand)").is("paid_on", null).not("due_on", "is", null).lt("due_on", today),
    db.from("reminders_sent").select("kind,ref_id,sent_on").gte("sent_on", addDays(today, -400)),
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

  const byUser = new Map<string, Line[]>();
  const push = (user: string, line: Line) => byUser.set(user, [...(byUser.get(user) ?? []), line]);
  const brandOf = (r: { deals: unknown }) => (r.deals as { brand?: string } | null)?.brand ?? "a deal";

  for (const d of dels.data ?? []) {
    const overdue = d.due_date! < today;
    const kind = overdue ? "deliverable_overdue" : "deliverable";
    if (lastSent.has(`${kind}:${d.id}`)) continue;
    const when = overdue ? `was due ${d.due_date}` : d.due_date === today ? "is due today" : `is due ${d.due_date}`;
    push(d.user_id, { kind, ref: d.id, text: `${overdue ? "⚠ " : "⏰ "}${d.title} for ${brandOf(d)} ${when}` });
  }

  const profiles = new Map<string, { email: string; name: string | null; currency: string }>();
  const userIds = [...new Set([...byUser.keys(), ...(pays.data ?? []).map((p) => p.user_id)])];
  if (userIds.length) {
    const { data } = await db.from("profiles").select("id,email,display_name,currency,reminders_enabled").in("id", userIds);
    for (const p of data ?? []) if (p.reminders_enabled) profiles.set(p.id, { email: p.email, name: p.display_name, currency: p.currency });
  }

  for (const p of pays.data ?? []) {
    const prev = lastSent.get(`payment_overdue:${p.id}`);
    if (prev && prev > weekAgo) continue;
    const cur = profiles.get(p.user_id)?.currency ?? "USD";
    push(p.user_id, { kind: "payment_overdue", ref: p.id, text: `💸 ${brandOf(p)}: ${p.label} (${formatMoney(p.amount_cents, cur)}) was due ${p.due_on}` });
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM || `${APP_NAME} <${SUPPORT_EMAIL}>`;
  let emails = 0;
  const failures: string[] = [];

  for (const [userId, lines] of byUser) {
    const profile = profiles.get(userId);
    if (!profile || lines.length === 0) continue;

    const items = lines.map((l) => `<li style="margin:8px 0;">${esc(l.text)}</li>`).join("");
    const html = `<!doctype html><html><body style="margin:0;background:#f7f2e8;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#15171e;"><div style="max-width:560px;margin:0 auto;padding:32px 16px;"><div style="background:#fffdf8;border:1px solid #e6dfcf;border-radius:20px;padding:28px 32px;"><div style="font-size:20px;font-weight:800;">${esc(APP_NAME)}<span style="color:#ff5a1f;">.</span></div><h1 style="font-size:24px;margin:16px 0 4px;">Heads up${profile.name ? `, ${esc(profile.name)}` : ""}</h1><p style="color:#454a57;margin:0 0 8px;">${lines.length === 1 ? "One thing needs" : `${lines.length} things need`} your attention:</p><ul style="padding-left:20px;line-height:1.5;">${items}</ul><p style="margin:20px 0 0;"><a href="${esc(SITE_URL)}/app" style="background:#ff5a1f;color:#15171e;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:12px;display:inline-block;">Open ${esc(APP_NAME)}</a></p><p style="font-size:12px;color:#6b7080;margin:24px 0 0;">You can turn these emails off in Settings.</p></div></div></body></html>`;

    const { error } = await resend.emails.send({
      from,
      to: profile.email,
      replyTo: SUPPORT_EMAIL,
      subject: `${APP_NAME}: ${lines.length} ${lines.length === 1 ? "reminder" : "reminders"}`,
      html,
      text: `${lines.map((l) => l.text).join("\n")}\n\nOpen ${APP_NAME}: ${SITE_URL}/app`,
    });
    if (error) {
      failures.push(`${userId}: ${error.message}`);
      continue;
    }
    emails++;
    await db.from("reminders_sent").insert(lines.map((l) => ({ user_id: userId, kind: l.kind, ref_id: l.ref, sent_on: today })));
  }

  if (failures.length) console.error("[reminders] send failures:", failures.join("; "));
  return { ok: true as const, emails, failures: failures.length };
}
