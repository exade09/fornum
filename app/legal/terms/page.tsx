import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="18 September 2026"
      intro="Fornum is an interface to a Solana program that deploys tokens, claims their creator fees and pays them out by phone. Using the site means agreeing to what follows"
      sections={[
        {
          title: "What the service does",
          body: [
            "Fornum deploys a token mint with our treasury as the creator fee recipient, claims the fees that accrue, and sends them to the number named at launch once its owner confirms. We are not a payment institution and we do not hold user funds outside token escrow",
          ],
        },
        {
          title: "Consent comes first",
          body: [
            "A number is dialed only while its owner keeps consent active. Whoever launches a token confirms they have the right to name that number",
            "If consent is missing or is pulled, the call is dropped and the fees stay in escrow for the launcher to redirect or withdraw",
          ],
        },
        {
          title: "What a call may not say",
          body: [
            "Calls must not misrepresent who is calling, what the message is, or the nature of the asset, and must not push the listener to buy anything under time pressure",
            "We can stop a call and return the escrow if the script breaks this rule",
          ],
        },
        {
          title: "Not financial advice",
          body: [
            "Neither the service nor the content of a call is a recommendation to buy or sell anything. Trading decisions are yours alone",
          ],
        },
        {
          title: "Liability",
          body: [
            "The service is provided as is. We are not responsible for carrier behaviour, WhatsApp availability or the state of the Solana network",
          ],
        },
      ]}
    />
  );
}
