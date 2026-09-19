import type { Metadata } from "next";
import { PageHero } from "@/components/shell/page-hero";
import { NumberPlate } from "@/components/home/number-plate";
import { PhoneThread } from "@/components/home/phone-thread";
import { Card } from "@/components/ui/primitives";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Launch" };

const RULES = [
  {
    t: "What to send",
    d: "A name, a ticker and a picture. The picture becomes the token image, so send it as a photo rather than a link",
  },
  {
    t: "What comes back",
    d: "The mint address and a pump.fun link, in the same thread, usually within a couple of minutes",
  },
  {
    t: "Who gets the fees",
    d: "The number that asked for the launch. Sign in here with that number to see the token and take what it earned",
  },
  {
    t: "What it costs you",
    d: "Nothing to launch. Fornum keeps a share of the creator fees, the rest is yours",
  },
];

export default function LaunchPage() {
  const { display, e164 } = siteConfig.whatsapp;

  return (
    <>
      <PageHero
        eyebrow="Start here"
        title="Launch over WhatsApp"
        description="There is no form on this page on purpose. A launch is a message, and the reply carries the mint address"
      />

      <section className="mx-auto grid w-full gap-10 px-4 pt-8 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:px-6 xl:max-w-7xl">
        <div className="flex flex-col gap-8">
          <NumberPlate display={display} e164={e164} />

          <div className="grid gap-3 sm:grid-cols-2">
            {RULES.map((r, i) => (
              <Card
                key={r.t}
                sheen
                className="animate-card-in motion-reduce:animate-none flex flex-col gap-2 p-5"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="text-sm font-bold text-primary">{r.t}</span>
                <p className="text-sm text-secondary">{r.d}</p>
              </Card>
            ))}
          </div>
        </div>

        <PhoneThread number={display} />
      </section>
    </>
  );
}
