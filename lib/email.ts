import { Resend } from "resend";
import { APP_NAME, EARLY_ACCESS_OFFER, FREE_DEAL_LIMIT, PARENT_BRAND, SITE_URL, SUPPORT_EMAIL } from "@/lib/config";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function render(position: number) {
  const n = escapeHtml(String(position));
  return `<!doctype html>
<html><body style="margin:0;background:#f7f2e8;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#15171e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf8;border:1px solid #e6dfcf;border-radius:20px;overflow:hidden;">
      <tr><td style="padding:28px 32px 0;font-size:20px;font-weight:800;letter-spacing:-0.02em;">${escapeHtml(APP_NAME)}<span style="color:#ff5a1f;">.</span></td></tr>
      <tr><td style="padding:20px 32px 0;">
        <h1 style="margin:0;font-size:28px;line-height:1.15;letter-spacing:-0.02em;">You're #${n} on the list.</h1>
        <p style="margin:14px 0 0;font-size:16px;line-height:1.6;color:#454a57;">Thanks for joining the ${escapeHtml(APP_NAME)} waitlist. We're building a CRM that keeps every sponsorship, deadline and payment in one place, made for creators, not sales teams.</p>
      </td></tr>
      <tr><td style="padding:20px 32px 0;">
        <div style="background:#fff1e8;border:1px solid #ffd2bb;border-radius:14px;padding:16px 18px;">
          <strong style="font-size:15px;">Early-access perk: ${escapeHtml(EARLY_ACCESS_OFFER)}.</strong>
          <p style="margin:6px 0 0;font-size:14px;line-height:1.55;color:#454a57;">When Pro launches, your spot locks in ${escapeHtml(EARLY_ACCESS_OFFER)}. The free plan covers your first ${FREE_DEAL_LIMIT} active deals.</p>
        </div>
      </td></tr>
      <tr><td style="padding:20px 32px 28px;font-size:15px;line-height:1.6;color:#454a57;">
        We'll email you once when your invite is ready. Questions? Just reply to this message.
      </td></tr>
      <tr><td style="padding:18px 32px;background:#f7f2e8;border-top:1px solid #e6dfcf;font-size:12px;color:#6b7080;">
        A ${escapeHtml(PARENT_BRAND)} product · <a href="${escapeHtml(SITE_URL)}" style="color:#6b7080;">${escapeHtml(SITE_URL.replace(/^https?:\/\//, ""))}</a>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

/** Sends the waitlist confirmation. Returns false (never throws) if email is unconfigured or fails. */
export async function sendWaitlistConfirmation(to: string, position: number): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const from = process.env.EMAIL_FROM || `${APP_NAME} <${SUPPORT_EMAIL}>`;

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to,
      replyTo: SUPPORT_EMAIL,
      subject: `You're #${position} on the ${APP_NAME} waitlist`,
      html: render(position),
      text: `You're #${position} on the ${APP_NAME} waitlist.\n\nEarly-access perk: ${EARLY_ACCESS_OFFER}. The free plan covers your first ${FREE_DEAL_LIMIT} active deals.\n\nWe'll email you once when your invite is ready.\n\nA ${PARENT_BRAND} product - ${SITE_URL}`,
    });
    if (error) {
      console.error("[waitlist] resend error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[waitlist] resend threw:", err instanceof Error ? err.message : err);
    return false;
  }
}
