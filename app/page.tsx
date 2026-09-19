import { HeroStats, LiveCallBadge } from "@/components/home/live-stats";
import { NumberPlate } from "@/components/home/number-plate";
import { PhoneThread } from "@/components/home/phone-thread";
import { siteConfig } from "@/lib/config";

const STEPS = [
  {
    n: "01",
    title: "Text LAUNCH",
    text: "One message to the number above starts a thread",
  },
  {
    n: "02",
    title: "Send a name and a ticker",
    text: "We deploy the mint with the fees pointed back at your number",
  },
  {
    n: "03",
    title: "Pick up when we call",
    text: "Confirm it is you, and the fees go out in dollars",
  },
];

export default function HomePage() {
  const { display, e164 } = siteConfig.whatsapp;

  return (
    <>
      {/* glow behind the hero, off to the side rather than centred */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] overflow-hidden">
        <div className="animate-orb-float motion-reduce:animate-none absolute -top-48 -left-32 size-[620px] rounded-full bg-brand/[0.07] blur-3xl" />
        <div
          className="animate-orb-float motion-reduce:animate-none absolute -top-24 right-0 size-[420px] rounded-full bg-dialing/[0.05] blur-3xl"
          style={{ animationDelay: "1.4s" }}
        />
      </div>

      <section className="mx-auto w-full px-4 pt-12 pb-16 lg:px-6 xl:max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="animate-section-in flex flex-col items-start gap-7">
            <LiveCallBadge />

            <h1 className="shimmer-text motion-reduce:animate-none max-w-[14ch] font-display text-4xl leading-[1.02] font-normal tracking-tight sm:text-5xl lg:text-[58px]">
              Launch a token with one message
            </h1>

            <p className="max-w-[48ch] text-base text-secondary sm:text-lg">
              No forms, no dashboard. Text Fornum on WhatsApp, and the creator
              fees of the token you launch come back to that same number
            </p>

            <NumberPlate display={display} e164={e164} />
          </div>

          <PhoneThread number={display} />
        </div>
      </section>

      {/* numbers as one banded strip, the only stat block on the page */}
      <section className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
        <HeroStats />
      </section>

      <section className="mx-auto w-full px-4 pt-16 pb-12 lg:px-6 xl:max-w-7xl">
        <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="animate-card-in motion-reduce:animate-none flex flex-col gap-2 border-t border-primary/[0.08] pt-5"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="tnum font-mono text-xs text-brand">{s.n}</span>
              <span className="text-base font-bold text-primary">
                {s.title}
              </span>
              <p className="max-w-[40ch] text-sm text-secondary">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
