import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="19 September 2026"
      intro="Fornum launches tokens on Solana on request and holds the creator fees those tokens earn until the person who launched them claims. Using the service means agreeing to what follows"
      sections={[
        {
          title: "What the service does",
          body: [
            "You send a name, a ticker and a picture over WhatsApp. We deploy the mint on pump.fun from a Fornum launch wallet and reply with the mint address. The creator fees that mint earns accrue to that wallet and are recorded against the number the request came from",
          ],
        },
        {
          title: "Claiming",
          body: [
            "Only the number a launch came from can claim its fees, unless that number handed them to another number. Claims go to a Solana address you provide, and network fees come out of the amount claimed",
            "We keep a share of the creator fees as our fee. The share in force is the one shown on the site at the time of the launch",
          ],
        },
        {
          title: "Handing fees over",
          body: [
            "Pointing the fees at another number is final. Everything the token earns afterwards, and anything unclaimed at that moment, belongs to that number",
          ],
        },
        {
          title: "What you must not launch",
          body: [
            "Tokens impersonating a real person, company or project, or presented as anything other than what they are. We can decline a launch or stop holding fees for one, and will say so in the thread",
          ],
        },
        {
          title: "Not financial advice",
          body: [
            "Nothing on this site is a recommendation to buy or sell anything. Tokens launched here carry no promise of value and most of them go to zero",
          ],
        },
        {
          title: "Liability",
          body: [
            "The service is provided as is. We are not responsible for the availability of WhatsApp, pump.fun or the Solana network, nor for the market behaviour of any token",
          ],
        },
      ]}
    />
  );
}
