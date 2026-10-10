import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { APP_NAME, EARLY_ACCESS_OFFER, FREE_DEAL_LIMIT, PARENT_BRAND, SUPPORT_EMAIL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms that apply when you use ${APP_NAME}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 9, 2026">
      <p>
        These terms are an agreement between you and {PARENT_BRAND} (&quot;{PARENT_BRAND}&quot;, &quot;we&quot;, &quot;us&quot;) about your use of the {APP_NAME} website, waitlist
        and app (together, the &quot;Service&quot;). By joining the waitlist, creating an account or using the Service you agree to these terms and to our{" "}
        <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the Service.
      </p>

      <h2>1. Who can use {APP_NAME}</h2>
      <p>
        You must be at least 16 and old enough to form a binding contract where you live. If you use the Service for a business, you confirm you can bind
        that business to these terms.
      </p>

      <h2>2. What {APP_NAME} is, and is not</h2>
      <p>
        {APP_NAME} helps creators organise brand deals: a pipeline, deadlines, payment tracking and a rate card. It records information you enter. It does
        not send invoices, collect money from brands, review contracts, or give legal, tax or financial advice. You are responsible for your agreements with
        brands and for your own invoicing, taxes and deadlines.
      </p>

      <h2>3. Waitlist and early access</h2>
      <p>
        Joining the waitlist reserves a place in line. It does not guarantee a launch date, access to any feature or an invitation at any particular time.
        We invite people in waves and may change or stop the waitlist at any time. Access during early access is provided &quot;as is&quot;, and features may change
        or be removed.
      </p>

      <h2>4. Early-access offer</h2>
      <p>
        People who join the waitlist are offered <strong>{EARLY_ACCESS_OFFER}</strong> on the Pro plan. It applies once per person to the waitlist email
        address, only to a Pro subscription you start from that account, and continues for as long as that subscription stays active without lapsing. It
        cannot be combined with other discounts, transferred or exchanged for cash. We may withdraw the offer for accounts that abuse the Service.
      </p>

      <h2>5. Your account</h2>
      <p>
        Keep your sign-in method secure and tell us right away about any unauthorised use. You are responsible for activity under your account. Provide
        accurate information and do not share your account with others.
      </p>

      <h2>6. Free and Pro plans</h2>
      <ul>
        <li>The free plan includes up to {FREE_DEAL_LIMIT} active deals at a time. A deal stops counting when it is marked Paid or archived.</li>
        <li>Pro removes that limit and may include other features we announce. Prices are shown before you subscribe.</li>
        <li>
          Paid subscriptions are billed in advance through Stripe and renew automatically each billing period until you cancel. You can cancel at any time
          from the billing portal in Settings. Cancellation takes effect at the end of the current period.
        </li>
        <li>
          Fees are non-refundable except where the law requires a refund or where we say otherwise in writing. We may change prices with at least 30
          days&apos; notice, which applies from your next renewal.
        </li>
        <li>If a subscription ends, your account returns to the free plan. Your data stays, but you may be unable to add deals beyond the free limit.</li>
      </ul>

      <h2>7. Your content</h2>
      <p>
        You own the information you put into {APP_NAME} (&quot;Your Content&quot;). You give us a limited licence to host, process and display it solely to run the
        Service for you. You promise that you have the right to add it, including any contact details of third parties, and that it does not break the law
        or anyone&apos;s rights. If you make a rate card public, anyone with the link can see it.
      </p>

      <h2>8. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>break the law, infringe others&apos; rights, or upload unlawful, harmful or deceptive content;</li>
        <li>attempt to access other users&apos; data, probe, scan or test the security of the Service without our written permission;</li>
        <li>interfere with or overload the Service, or use bots, scrapers or automated means to access it;</li>
        <li>reverse engineer the Service, except where the law allows; or</li>
        <li>use the Service to send spam or to harass anyone.</li>
      </ul>

      <h2>9. Our rights</h2>
      <p>
        The Service, including its software, design, text and branding, belongs to {PARENT_BRAND} and its licensors. We grant you a limited, revocable,
        non-exclusive, non-transferable right to use it under these terms. If you send us feedback, we may use it without obligation to you.
      </p>

      <h2>10. Third-party services</h2>
      <p>
        The Service relies on providers such as Cloudflare, Supabase, Resend, Stripe and Google. Their terms apply to your use of their services, and we are
        not responsible for them.
      </p>

      <h2>11. Availability and changes</h2>
      <p>
        We work to keep the Service available, but we do not promise it will be uninterrupted or error free. Reminder emails and overdue alerts are an aid
        and may be delayed or fail, so do not rely on them as your only way to meet a deadline or collect a payment. We may update or discontinue features,
        and we will give reasonable notice of material changes where we can.
      </p>

      <h2>12. Suspension and termination</h2>
      <p>
        You can stop using the Service and delete your account at any time. We may suspend or end your access if you break these terms, create risk or
        legal exposure for us or others, or if we stop offering the Service. We will give notice where reasonable. Sections that by their nature should
        survive termination will do so.
      </p>

      <h2>13. Disclaimers</h2>
      <p>
        To the fullest extent the law allows, the Service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind, whether express or implied,
        including merchantability, fitness for a particular purpose, accuracy and non-infringement. Nothing in these terms limits rights you have under
        consumer protection laws that cannot be waived.
      </p>

      <h2>14. Limitation of liability</h2>
      <p>
        To the fullest extent the law allows, {PARENT_BRAND} will not be liable for indirect, incidental, special, consequential or punitive damages, or for
        lost profits, revenue, data or goodwill, arising from your use of the Service. Our total liability for any claim relating to the Service is limited to
        the greater of the amount you paid us in the 12 months before the claim and CAD $50. Some places do not allow these limits, so they apply only as far
        as the law permits.
      </p>

      <h2>15. Indemnity</h2>
      <p>
        You agree to defend and indemnify {PARENT_BRAND} against claims, losses and costs (including reasonable legal fees) arising from Your Content or your
        breach of these terms, to the extent the law allows.
      </p>

      <h2>16. Governing law</h2>
      <p>
        These terms are governed by the laws of the province or territory of Canada in which {PARENT_BRAND} is based, and the federal laws of Canada that
        apply there, without regard to conflict-of-law rules. Courts in that province have exclusive jurisdiction, except that you may bring a claim in your
        local courts where consumer law gives you that right.
      </p>

      <h2>17. Changes to these terms</h2>
      <p>
        We may update these terms. We will change the date above and, for material changes, give you notice by email or in the app. If you keep using the
        Service after the changes take effect, you accept them. If you do not agree, stop using the Service.
      </p>

      <h2>18. Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
