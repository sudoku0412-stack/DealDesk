import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { APP_NAME, PARENT_BRAND, SUPPORT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${APP_NAME} collects, uses and protects your personal information.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 9, 2026">
      <p>
        {APP_NAME} is a product of {PARENT_BRAND} (&quot;{PARENT_BRAND}&quot;, &quot;we&quot;, &quot;us&quot;). This policy explains what personal information we collect when
        you visit our website, join the waitlist or use the {APP_NAME} app, why we collect it, who we share it with and the choices you have.
        We handle personal information in line with Canada&apos;s Personal Information Protection and Electronic Documents Act (PIPEDA) and, where it
        applies to you, the GDPR and UK GDPR.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Waitlist.</strong> Your email address, your main platform (for example YouTube or TikTok) and the time you signed up.
        </li>
        <li>
          <strong>Your account.</strong> Your email address, an optional display name, your currency and plan, and your sign-in details. If you sign in with
          Google, we receive your email address and basic profile from Google. We never receive your Google password.
        </li>
        <li>
          <strong>Content you add to the app.</strong> Deals, brand names, deal values, deliverables and dates, payment records, notes, templates and rate
          card items. This can include names and email addresses of people at brands you work with. You are responsible for having a legitimate reason to
          record that information.
        </li>
        <li>
          <strong>Billing.</strong> If you subscribe to a paid plan, payment is handled by Stripe. We receive your plan status, and Stripe customer and
          subscription identifiers. We never see or store your full card number.
        </li>
        <li>
          <strong>Website analytics.</strong> For each page view on our marketing site we store the page, the referring website, your country and a
          daily-changing anonymous hash. We do not store IP addresses in our analytics, we do not use advertising trackers and we respect the &quot;Do Not
          Track&quot; signal. Visits to signed-in and admin pages are not recorded.
        </li>
        <li>
          <strong>Technical data.</strong> Our hosting provider processes your IP address and browser details to deliver the site and protect it from abuse.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To run the waitlist, confirm your spot and invite you when access opens.</li>
        <li>To provide, secure and support the app, including sign-in and the reminder emails you can switch off in Settings.</li>
        <li>To process subscriptions and apply the early-access discount you were offered.</li>
        <li>To understand how the site is used and improve it, using the anonymous analytics above.</li>
        <li>To meet legal obligations and to prevent fraud and abuse.</li>
      </ul>
      <p>
        We rely on your consent (for example when you join the waitlist), on our need to provide the service you asked for, and on our legitimate interest in
        running and securing a safe product. You can withdraw consent at any time.
      </p>

      <h2>3. Cookies and local storage</h2>
      <p>
        We use only what is needed to make the site work: a sign-in session cookie after you log in, an admin session cookie for staff, and a local
        setting that remembers your light or dark theme. We do not use advertising or cross-site tracking cookies.
      </p>

      <h2>4. Who we share it with</h2>
      <p>We do not sell your personal information. We share it only with service providers who process it on our behalf:</p>
      <ul>
        <li>Cloudflare: website hosting, security and email routing.</li>
        <li>Supabase: database and sign-in.</li>
        <li>Resend: sending confirmation, sign-in and reminder emails.</li>
        <li>Stripe: payment processing for paid plans.</li>
        <li>Google: sign-in, only if you choose &quot;Continue with Google&quot;.</li>
      </ul>
      <p>
        We may also disclose information if the law requires it, or to protect our rights and users, or as part of a business transfer, in which case the
        recipient must honour this policy.
      </p>

      <h2>5. Where your data is stored</h2>
      <p>
        Our providers operate internationally, so your information may be processed in Canada, the United States and other countries whose privacy laws may
        differ from yours. We use providers that apply appropriate safeguards for these transfers.
      </p>

      <h2>6. How long we keep it</h2>
      <p>
        We keep waitlist entries until you ask us to remove them or until the waitlist is no longer needed. We keep account content for as long as you have an
        account. When you delete your account or ask us to, we delete or anonymise your personal information, except for what we must keep for legal,
        accounting or security reasons. Anonymous analytics records are kept only as long as they are useful for reporting.
      </p>

      <h2>7. Your rights</h2>
      <p>
        You can ask to access, correct, export or delete your personal information, withdraw your consent, or object to certain processing. In the app you
        can export your deals and payments as CSV files. For anything else, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We will respond within 30 days. If you are not satisfied, you may contact the Office of the
        Privacy Commissioner of Canada, or your local data protection authority.
      </p>

      <h2>8. Emails</h2>
      <p>
        We send emails you ask for or that are part of the service: your waitlist confirmation, one invitation when access opens, sign-in links, receipts and
        reminders. Reminder emails can be turned off in Settings. If you would like us to stop emailing you, reply to any message or write to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>9. Security</h2>
      <p>
        We use encryption in transit, row-level access controls so that each user can only see their own data, and limited staff access. No system is
        perfectly secure, so we cannot guarantee absolute security. If a breach creates a real risk of significant harm, we will notify affected people and
        the regulator as the law requires.
      </p>

      <h2>10. Children</h2>
      <p>{APP_NAME} is not directed to anyone under 16, and we do not knowingly collect their information. If you believe a child has given us information, contact us and we will delete it.</p>

      <h2>11. Changes to this policy</h2>
      <p>
        We may update this policy. We will change the date above and, for material changes, notify you by email or in the app before they take effect.
      </p>

      <h2>12. Contact</h2>
      <p>
        {PARENT_BRAND}, <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Questions about privacy are welcome.
      </p>
    </LegalPage>
  );
}
