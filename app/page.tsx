import Link from "next/link";
import {
  HeroStats,
  HomeBento,
  LaunchMarquee,
  LiveCallBadge,
} from "@/components/home/bento";
import { Card } from "@/components/ui/primitives";
import { TokenMark } from "@/components/ui/token-mark";
import { Waveform } from "@/components/ui/waveform";
import { ArrowRightIcon, PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { CALLS, getStats, getToken, num, usd } from "@/lib/data";

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
  const stats = getStats();
  const live = CALLS.find((c) => c.status === "dialing");
  const liveToken = live ? getToken(live.tokenId) : undefined;

  return (
    <>
      {/* glow sits behind the hero, off to the side rather than centred */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] overflow-hidden">
        <div className="animate-orb-float motion-reduce:animate-none absolute -top-48 -left-32 size-[620px] rounded-full bg-brand/[0.07] blur-3xl" />
        <div
          className="animate-orb-float motion-reduce:animate-none absolute -top-24 right-0 size-[420px] rounded-full bg-dialing/[0.05] blur-3xl"
          style={{ animationDelay: "1.4s" }}
        />
      </div>

      <section className="mx-auto w-full px-4 pt-12 pb-12 lg:px-6 xl:max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          {/* copy on the left, ranged left rather than centred */}
          <div className="animate-section-in flex flex-col items-start gap-6">
            <LiveCallBadge />

            <h1 className="shimmer-text motion-reduce:animate-none max-w-[15ch] font-display text-left text-4xl leading-[1.02] font-normal tracking-tight sm:text-5xl lg:text-[58px]">
              Launch a token, get its fees by phone
            </h1>

            <p className="max-w-[52ch] text-base text-secondary sm:text-lg">
              Fornum deploys your token on Solana and keeps the creator fees
              pointed at one WhatsApp number. We claim them, call to confirm,
              and pay out in dollars
            </p>

            <div className="flex flex-wrap items-center gap-3">
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
          </div>

          {/* live panel on the right, the thing the product actually does */}
          <Card
            sheen
            className="animate-scale-in motion-reduce:animate-none flex flex-col gap-4 p-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.12em] text-secondary uppercase">
                Happening now
              </span>
              <Link
                href="/queue"
                className="group flex items-center gap-1 text-xs text-secondary transition-colors hover:text-primary"
              >
                Full queue
                <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {live && (
              <div className="flex flex-col gap-3 rounded-xl border border-brand/20 bg-brand/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/15">
                    <span className="animate-ring-pulse motion-reduce:animate-none absolute size-10 rounded-full bg-brand/40" />
                    <PhoneIcon className="size-5 text-brand" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="tnum truncate text-sm font-bold text-primary">
                      {live.phone}
                    </span>
                    <span className="truncate text-xs text-secondary">
                      {liveToken?.symbol} fees,{" "}
                      {live.agent === "operator"
                        ? "live operator"
                        : "recorded voice"}
                    </span>
                  </div>
                  <TokenMark
                    symbol={liveToken?.symbol ?? "?"}
                    size="md"
                    className="ml-auto size-9"
                  />
                </div>
                <Waveform className="h-7" bars={30} />
              </div>
            )}

            <div className="flex flex-col gap-2">
              {CALLS.filter(
                (c) => c.status === "queued" || c.status === "verifying",
              )
                .slice(0, 2)
                .map((c, i) => {
                  const token = getToken(c.tokenId);
                  return (
                    <div
                      key={c.id}
                      className="animate-card-in motion-reduce:animate-none flex items-center gap-3 rounded-xl border border-primary/[0.06] px-3 py-2.5"
                      style={{ animationDelay: `${220 + i * 110}ms` }}
                    >
                      <span className="tnum flex size-7 shrink-0 items-center justify-center rounded-full bg-background/70 text-xs font-bold text-queued ring-1 ring-primary/[0.08]">
                        {c.position}
                      </span>
                      <TokenMark
                        symbol={token?.symbol ?? "?"}
                        size="sm"
                        className="size-7"
                      />
                      <span className="truncate text-xs font-bold text-primary">
                        {token?.symbol}
                      </span>
                      <span className="tnum ml-auto truncate text-xs text-secondary">
                        {c.phone}
                      </span>
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/15">
                        <WhatsAppIcon className="size-3 text-brand" />
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="flex items-center justify-between border-t border-primary/[0.06] pt-3 text-xs text-secondary">
              <span className="tnum">{num(stats.callsInQueue)} waiting</span>
              <span className="tnum">
                {usd(stats.paidOutUsd, 0)} paid out so far
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* numbers as one banded strip, not four floating cards */}
      <section className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
        <HeroStats />
      </section>

      <div className="mx-auto w-full px-4 pt-8 pb-10 lg:px-6 xl:max-w-7xl">
        <LaunchMarquee />
      </div>

      <HomeBento />

      <section className="mx-auto w-full px-4 pt-20 pb-10 lg:px-6 xl:max-w-7xl">
        <div className="animate-section-in grid gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-2 lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-2xl font-normal tracking-tight text-primary">
              Three steps, one number
            </h2>
            <p className="max-w-[40ch] text-sm text-secondary">
              Fees only exist for tokens deployed through Fornum, so there is
              always a recipient on file
            </p>
            <Link
              href="/launch"
              className="group mt-2 flex w-fit items-center gap-1.5 text-sm font-bold text-brand"
            >
              Start a launch
              <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* steps read down the page instead of across, with a rule joining them */}
          <ol className="flex flex-col">
            {STEPS.map((s, i) => (
              <li
                key={s.n}
                className="animate-card-in motion-reduce:animate-none flex gap-5 border-t border-primary/[0.06] py-6 first:border-t-0 first:pt-0"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="tnum shrink-0 font-mono text-sm text-brand">
                  {s.n}
                </span>
                <div className="flex flex-col gap-1.5">
                  <span className="text-base font-bold text-primary">
                    {s.title}
                  </span>
                  <p className="max-w-[58ch] text-sm text-secondary">
                    {s.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
