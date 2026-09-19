import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="19 September 2026"
      intro="The only sensitive thing we handle is a phone number. Here is where it goes, where it does not, and how to remove it"
      sections={[
        {
          title: "What goes on chain",
          body: [
            "The token account stores the mint, the launch wallet, a salted hash of the number the launch came from, and the amounts collected and claimed. The number itself never goes on chain",
          ],
        },
        {
          title: "What stays off chain",
          body: [
            "The WhatsApp thread, the mapping between hash and number, and the pictures you send for the token image. The site shows a masked number to everyone, and the full one to nobody",
          ],
        },
        {
          title: "What we do not do",
          body: [
            "We do not message you first, we do not sell numbers, we do not pass them to third parties for their own outreach, and we do not link numbers across different launches",
          ],
        },
        {
          title: "Removal",
          body: [
            "Ask in the thread and we delete the number and the conversation. Tokens already launched stay on chain because they cannot be deleted, but they only ever carried the hash",
          ],
        },
      ]}
    />
  );
}
