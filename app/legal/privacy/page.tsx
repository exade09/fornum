import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="18 September 2026"
      intro="The only sensitive thing we handle is a phone number. Here is where it goes, where it does not, and how to remove it"
      sections={[
        {
          title: "What goes on chain",
          body: [
            "The token account stores the mint, the creator wallet, a salted hash of the recipient number, the amounts claimed and paid, the queue index and the status. The number itself never goes on chain",
          ],
        },
        {
          title: "What stays off chain",
          body: [
            "The mapping between hash and number, the time consent was given, and technical notes about call attempts. Whoever places a call receives the number for the length of that call and nothing more",
          ],
        },
        {
          title: "What we do not do",
          body: [
            "We do not sell numbers, pass them to third parties for their own outreach, enrich them from outside sources, or link numbers across different launches",
          ],
        },
        {
          title: "Removal",
          body: [
            "Revoking consent removes the number from every future call. Past payouts stay on chain because they cannot be deleted, but they only ever contained the hash",
          ],
        },
      ]}
    />
  );
}
