import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { APP_NAME, EARLY_ACCESS_OFFER } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <h2>The waitlist</h2>
      <p>
        Joining the {APP_NAME} waitlist reserves your place in line. It does not guarantee a launch date or access to any
        specific feature.
      </p>
      <h2>Early-access offer</h2>
      <p>
        Waitlist members are intended to receive {EARLY_ACCESS_OFFER} on the Pro plan. Full terms of the offer will be published
        when Pro launches.
      </p>
      <h2>Changes</h2>
      <p>These terms are a placeholder and will be replaced by full terms before the product launches.</p>
    </LegalPage>
  );
}
