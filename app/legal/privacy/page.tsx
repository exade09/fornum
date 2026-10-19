import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="20 October 2026"
      intro="The only sensitive thing we handle is a phone number. Here is where it goes, where it does not, and how to remove it"
      sections={[
        {
          title: "What goes on chain",
          body: [
            "The coin, the wallet it was launched from and every payout are public Solana records. Neither the number nor its hash goes on chain: the salted hash that ties the thread to the token is kept in Fornum's own database",
          ],
        },
        {
          title: "What stays off chain",
          body: [
            "The WhatsApp thread, the mapping between hash and number, and the pictures you send for the token image. The site shows a masked number to everyone, and the full one to nobody",
            "While a sign in is waiting to be confirmed, the number you typed is kept encrypted so the Fornum operator can see who is signing in. It is deleted when the sign in completes or its code expires",
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
            "Ask in the thread and we delete the number and the conversation. Tokens already launched stay on chain because they cannot be deleted, but they never carried the number",
          ],
        },
      ]}
    />
  );
}
