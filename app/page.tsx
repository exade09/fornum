import Link from "next/link";
import {
  HeroStats,
  HomeBento,
  LaunchMarquee,
  LiveCallBadge,
} from "@/components/home/bento";
import { Card } from "@/components/ui/primitives";
import { ArrowRightIcon } from "@/components/icons";

const STEPS = [
  {
    n: "01",
    title: "Launch your token",
    text: "Name it, add a ticker and an image. We deploy the mint with our treasury set as the fee recipient",
  },
  {
    n: "02",
    title: "Point the fees at a number",
    text: "Enter the WhatsApp number that should receive them. The owner confirms it once, and can pull consent any time",
  },
  {
    n: "03",
    title: "Answer the call, take the money",
    text: "We claim the creator fees, call the number to confirm, and send the payout in dollars",
  },
];

export default function HomePage() {
  return (
    <>
      {/* soft glow behind the hero, sits under everything */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden">
        <div className="animate-orb-float motion-reduce:animate-none absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-brand/[0.07] blur-3xl" />
        <div
          className="animate-orb-float motion-reduce:animate-none absolute -top-24 left-1/4 size-[380px] rounded-full bg-dialing/[0.05] blur-3xl"
          style={{ animationDelay: "1.4s" }}
        />
      </div>

      <div className="pt-8 sm:pt-14">
        <section className="animate-section-in mx-auto flex w-full flex-col items-center gap-6 px-4 pb-10 text-center lg:px-6 xl:max-w-7xl">
          <LiveCallBadge />

          <h1 className="shimmer-text motion-reduce:animate-none max-w-[18ch] font-display text-4xl leading-[1.04] font-normal tracking-tight sm:text-5xl md:text-6xl">
            Launch a token, get its fees by phone
          </h1>

          <p className="max-w-[58ch] text-base text-secondary sm:text-lg">
            Fornum deploys your token on Solana and keeps the creator fees
            pointed at one WhatsApp number. We claim them, call to confirm, and
            pay out in dollars
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href="/launch"
              className="border-beam flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
            >
              Launch a token
            </Link>
            <Link
              href="/docs"
              className="group flex h-11 items-center gap-1.5 rounded-full border px-6 text-sm font-bold text-primary transition-colors hover:bg-card"
            >
              See how it works
              <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        <div className="animate-section-in mx-auto w-full px-4 pb-8 lg:px-6 xl:max-w-7xl">
          <LaunchMarquee />
        </div>

        <div
          className="animate-section-in mx-auto w-full px-4 pb-12 lg:px-6 xl:max-w-7xl"
          style={{ animationDelay: "80ms" }}
        >
          <HeroStats />
        </div>
      </div>

      <HomeBento />

      <section className="mx-auto w-full px-4 pt-20 pb-10 lg:px-6 xl:max-w-7xl">
        <div className="animate-section-in flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-2xl font-normal tracking-tight text-primary">
              Three steps, one number
            </h2>
            <p className="max-w-[62ch] text-sm text-secondary">
              Fees only exist for tokens deployed through Fornum, so there is
              always a recipient on file
            </p>
          </div>

          <div className="relative grid gap-3 md:grid-cols-3">
            {/* connector runs behind the cards on wide screens */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-11 right-[16%] left-[16%] hidden md:block"
            >
              <div className="animate-flow-dash motion-reduce:animate-none h-px w-full [background-image:repeating-linear-gradient(90deg,hsl(var(--primary)/0.22)_0_6px,transparent_6px_14px)] [background-size:14px_1px]" />
            </div>

            {STEPS.map((s, i) => (
              <Card
                key={s.n}
                lift
                sheen
                className="animate-card-in motion-reduce:animate-none relative flex flex-col gap-3 p-5"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="tnum flex size-9 items-center justify-center rounded-full bg-background/70 text-xs font-bold text-brand ring-1 ring-primary/[0.08]">
                  {s.n}
                </span>
                <span className="text-sm font-bold text-primary">{s.title}</span>
                <p className="text-sm text-secondary">{s.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
