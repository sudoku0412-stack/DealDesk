import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>What we collect</h2>
      <p>
        When you join the {APP_NAME} waitlist we store your email address, your main platform and the time you signed up.
      </p>
      <h2>Site analytics</h2>
      <p>
        We count visits without cookies. For each page view we store the page, the referring site, the visitor&apos;s country and
        a daily-changing anonymous hash. We never store IP addresses, and we skip visitors who send a Do Not Track signal.
      </p>
      <h2>How we use it</h2>
      <p>
        To confirm your spot, tell you your position on the list and email you when your invite is ready. We do not sell your
        data.
      </p>
      <h2>Your choices</h2>
      <p>You can ask us to delete your waitlist entry at any time by emailing us.</p>
    </LegalPage>
  );
}
