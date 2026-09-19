import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  CreateIcon,
  PayoutIcon,
  PhoneIcon,
  QueueIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { TokenMark } from "@/components/ui/token-mark";
import { Waveform } from "@/components/ui/waveform";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Card } from "@/components/ui/primitives";
import {
  CALLS,
  PAYOUTS,
  TOKENS,
  compactUsd,
  getStats,
  getToken,
  num,
  usd,
} from "@/lib/data";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Tile shell                                                          */
/* ------------------------------------------------------------------ */

/**
 * The label sits at the top with the arrow opposite it, and the preview fills
 * whatever is left, so a tile reads title first and picture second
 */
function BentoCard({
  href,
  label,
  hint,
  row,
  icon: Icon,
  className,
  children,
}: {
  href: string;
  label: string;
  hint: string;
  row: number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{ "--tile-row": row } as React.CSSProperties}
      className={cn(
        "group/card card-lift card-sheen relative isolate flex h-[280px] flex-col overflow-hidden rounded-2xl border border-primary/[0.06] bg-card",
        className,
      )}
    >
      <div className="flex shrink-0 items-start gap-3 px-4 pt-4 pb-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/70 ring-1 ring-primary/[0.08]">
          <Icon className="size-4 text-brand" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-bold text-primary">{label}</span>
          <span className="truncate text-xs text-secondary">{hint}</span>
        </div>
        <span className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/[0.06] text-secondary transition-colors group-hover/card:border-primary/20 group-hover/card:text-primary">
          <ArrowRightIcon className="size-3.5 transition-transform group-hover/card:translate-x-0.5" />
        </span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </Link>
  );
}

const FADE =
  "pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-card to-transparent";

/* ------------------------------------------------------------------ */
/* 1. Launch                                                           */
/* ------------------------------------------------------------------ */

export function LaunchTile() {
  return (
    <BentoCard
      href="/launch"
      label="Launch"
      hint="Deploy a token, point its fees at a number"
      row={0}
      icon={CreateIcon}
      className="lg:col-span-5 lg:row-span-2 lg:h-full"
    >
      <div className="absolute inset-0 flex flex-col gap-3 p-4">
        <span className="text-[10px] font-bold tracking-wider text-secondary">
          NEW TOKEN
        </span>

        <div className="flex gap-2">
          <TokenMark symbol="LCAT" size="lg" className="size-12" />
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
            <span className="flex h-7 items-center overflow-hidden rounded-lg border border-primary/[0.06] bg-background/70 px-2.5">
              <span className="animate-type-query motion-reduce:animate-none block overflow-hidden text-xs whitespace-nowrap text-primary">
                Ledger Cat
              </span>
              <span className="animate-type-caret motion-reduce:animate-none ml-px h-3 w-px bg-primary" />
            </span>
            <span className="flex h-7 items-center rounded-lg border border-primary/[0.06] bg-background/70 px-2.5 text-xs text-secondary">
              LCAT
            </span>
          </div>
        </div>

        <span className="text-[10px] font-bold tracking-wider text-secondary">
          FEES GO TO
        </span>

        <div className="flex items-center gap-2 rounded-lg border border-brand/25 bg-brand/[0.07] px-2.5 py-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15">
            <WhatsAppIcon className="size-4 text-brand" />
          </span>
          <span className="tnum text-xs text-primary">+1 415 ••• 77 12</span>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-brand/15 px-1.5 py-0.5 text-[9px] font-bold text-brand">
            <CheckIcon className="size-2.5" />
            Confirmed
          </span>
        </div>

        {/* only the tall version has room for this, so it stays hidden below lg */}
        <div className="mt-4 hidden flex-col gap-2 lg:flex">
          <span className="text-[10px] font-bold tracking-wider text-secondary">
            THEN WE CALL
          </span>
          <div className="flex flex-col gap-2 rounded-lg border border-primary/[0.06] bg-background/70 p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/15">
                <span className="animate-ring-pulse motion-reduce:animate-none absolute size-7 rounded-full bg-brand/40" />
                <PhoneIcon className="size-3.5 text-brand" />
              </span>
              <span className="text-xs text-primary">
                Confirm this number and we send the fees
              </span>
            </div>
            <Waveform className="h-6" bars={26} />
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3">
          <span className="flex h-8 items-center rounded-full bg-primary px-4 text-xs font-bold text-background">
            Deploy
          </span>
          <span className="text-[11px] text-secondary">
            takes about 20 seconds
          </span>
        </div>
      </div>
      <div className={FADE} />
    </BentoCard>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Payouts feed                                                     */
/* ------------------------------------------------------------------ */

const FEED_ROW_H = 64;

function PayoutRow({ index }: { index: number }) {
  const item = PAYOUTS[index % PAYOUTS.length];
  const token = getToken(item.tokenId);
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-primary/[0.06] bg-background/70 px-3"
      style={{ height: FEED_ROW_H - 8, marginBottom: 8 }}
    >
      <div className="flex min-w-0 flex-col">
        <span className="tnum text-base font-bold text-primary">
          {usd(item.amount, 0)}
        </span>
        <span className="truncate text-[11px] text-secondary">
          {token?.symbol} fees to{" "}
          <span className="tnum text-primary/80">{item.phone}</span>
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <TokenMark symbol={token?.symbol ?? "?"} size="sm" className="size-7" />
        <span className="flex size-7 items-center justify-center rounded-full bg-brand/15">
          <WhatsAppIcon className="size-4 text-brand" />
        </span>
        <span className="tnum w-6 text-right text-[10px] text-secondary">
          {item.ago}
        </span>
      </div>
    </div>
  );
}

export function PayoutsTile() {
  return (
    <BentoCard
      href="/payouts"
      label="Payouts"
      hint="Every claim lands on a confirmed number"
      row={0}
      icon={PayoutIcon}
      className="lg:col-span-7"
    >
      <div className="absolute inset-0 px-3 pt-3">
        <div
          className="animate-feed-rise motion-reduce:animate-none"
          style={{ "--feed-step": `${FEED_ROW_H}px` } as React.CSSProperties}
        >
          {Array.from({ length: 14 }, (_, i) => (
            <PayoutRow key={i} index={i} />
          ))}
        </div>
      </div>
      <div className={FADE} />
    </BentoCard>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Tokens wall                                                      */
/* ------------------------------------------------------------------ */

const WALL_COLS = 3;
const WALL_ROWS = 4;
const COL_W = 132;
const COL_GAP = 10;
const CARD_H = 76;
const CARD_GAP = 10;
const BLOCK_W = WALL_COLS * (COL_W + COL_GAP);
const BLOCK_H = WALL_ROWS * (CARD_H + CARD_GAP);

function WallCard({ index }: { index: number }) {
  const t = TOKENS[index % TOKENS.length];
  return (
    <div
      className="flex shrink-0 flex-col justify-between rounded-xl border border-primary/[0.06] bg-background/70 p-2"
      /* margin rather than gap keeps the column height at exactly
         N * (CARD_H + CARD_GAP), which is what makes the field tile */
      style={{ width: COL_W, height: CARD_H, marginBottom: CARD_GAP }}
    >
      <div className="flex items-center gap-1.5">
        <TokenMark symbol={t.symbol} size="sm" className="size-6" />
        <span className="truncate text-[10px] font-bold text-primary">
          {t.symbol}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="tnum text-[12px] font-bold text-brand">
          {compactUsd(t.feesClaimed)}
        </span>
        <span className="tnum text-[9px] text-secondary">
          {compactUsd(t.marketCap)}
        </span>
      </div>
    </div>
  );
}

export function TokensTile() {
  return (
    <BentoCard
      href="/tokens"
      label="Tokens"
      hint="Launched here, fees already routed"
      row={1}
      icon={QueueIcon}
      className="sm:col-span-3 lg:col-span-4"
    >
      <div className="absolute inset-0">
        <div
          className="animate-diag-pan motion-reduce:animate-none absolute top-0 left-0 origin-top-left"
          style={
            {
              "--block-w": `${BLOCK_W}px`,
              "--block-h": `${BLOCK_H}px`,
              "--field-scale": 0.95,
            } as React.CSSProperties
          }
        >
          <div className="flex">
            {Array.from({ length: WALL_COLS * 2 }, (_, col) => (
              <div
                key={col}
                className="flex flex-col"
                style={{
                  width: COL_W,
                  marginRight: COL_GAP,
                  marginTop: col % 2 ? -(CARD_H + CARD_GAP) / 2 : 0,
                }}
              >
                {Array.from({ length: WALL_ROWS * 2 }, (_, row) => (
                  <WallCard key={row} index={col * 3 + row} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className={FADE} />
      </div>
    </BentoCard>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Call queue                                                       */
/* ------------------------------------------------------------------ */

export function CallsTile() {
  const stats = getStats();
  const rows = CALLS.filter(
    (c) =>
      c.status === "dialing" ||
      c.status === "queued" ||
      c.status === "verifying",
  ).slice(0, 4);

  return (
    <BentoCard
      href="/queue"
      label="Calls"
      hint="Live queue with your position"
      row={1}
      icon={PhoneIcon}
      className="sm:col-span-3 lg:col-span-3"
    >
      <div className="absolute inset-0 flex flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-bold tracking-wider text-secondary">
            IN QUEUE
          </span>
          <span className="tnum text-xl font-bold text-primary">
            {num(stats.callsInQueue)}
          </span>
        </div>

        {rows.map((c, i) => {
          const token = getToken(c.tokenId);
          const live = c.status === "dialing";
          return (
            <div
              key={c.id}
              className="animate-card-in motion-reduce:animate-none flex items-center gap-2 rounded-lg border border-primary/[0.06] bg-background/70 px-2 py-1.5"
              style={{ animationDelay: `${180 + i * 110}ms` }}
            >
              <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/15">
                {live && (
                  <span className="animate-ring-pulse motion-reduce:animate-none absolute size-6 rounded-full bg-brand/40" />
                )}
                <PhoneIcon className="size-3 text-brand" />
              </span>
              <span className="truncate text-[11px] font-bold text-primary">
                {token?.symbol}
              </span>
              <span className="tnum truncate text-[10px] text-secondary">
                {c.phone}
              </span>
              <span
                className={cn(
                  "tnum ml-auto shrink-0 text-[10px] font-bold",
                  live ? "text-dialing" : "text-queued",
                )}
              >
                {live ? "now" : `#${c.position}`}
              </span>
            </div>
          );
        })}
      </div>
      <div className={FADE} />
    </BentoCard>
  );
}

/* ------------------------------------------------------------------ */
/* Grid                                                                */
/* ------------------------------------------------------------------ */

export function HomeBento() {
  return (
    <div className="row-stagger">
      <section className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
        {/* one tall tile on the left, the rest stacked beside it, then a wide
            strip underneath, so the block is not a row of equal boxes */}
        <div className="grid gap-3 sm:grid-cols-6 lg:grid-cols-12">
          <LaunchTile />
          <PayoutsTile />
          <TokensTile />
          <CallsTile />
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hero pieces                                                         */
/* ------------------------------------------------------------------ */

export function LiveCallBadge() {
  const stats = getStats();
  const label =
    stats.callsLive > 0
      ? `${num(stats.callsLive)} ${stats.callsLive === 1 ? "call" : "calls"} on the line, ${num(stats.callsInQueue)} waiting`
      : `${num(stats.callsInQueue)} ${stats.callsInQueue === 1 ? "call" : "calls"} in the queue`;

  return (
    <Link
      href="/queue"
      className="group relative inline-flex items-center gap-2 rounded-full border border-primary/[0.08] bg-card px-3 py-1.5 text-xs text-secondary transition-colors hover:border-primary/20 hover:text-primary"
    >
      <span className="relative flex size-2 items-center justify-center">
        <span className="animate-ring-pulse motion-reduce:animate-none absolute size-2 rounded-full bg-brand" />
        <span className="size-2 rounded-full bg-brand" />
      </span>
      <PhoneIcon className="size-3.5 text-brand" />
      <span className="tnum">{label}</span>
      <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Scrolling strip of the latest launches, duplicated so the loop is seamless */
export function LaunchMarquee() {
  const strip = [...TOKENS, ...TOKENS];

  return (
    <div className="relative overflow-hidden py-2">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />

      <div className="animate-marquee motion-reduce:animate-none flex w-max gap-2">
        {strip.map((t, i) => (
          <span
            key={`${t.id}-${i}`}
            className="flex items-center gap-2 rounded-full border border-primary/[0.06] bg-card px-3 py-1.5"
          >
            <TokenMark symbol={t.symbol} size="sm" className="size-5" />
            <span className="text-xs font-bold text-primary">{t.symbol}</span>
            <span className="tnum text-xs text-brand">
              {compactUsd(t.feesClaimed)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Headline numbers, driven by real activity unless an override is set */
export function HeroStats() {
  const stats = getStats();

  const items: {
    label: string;
    value: string;
    prefix?: string;
    suffix?: string;
  }[] = [
    { label: "Tokens launched", value: num(stats.tokensLaunched) },
    {
      label: "Fees claimed",
      value: usd(stats.feesClaimedUsd, 0).slice(1),
      prefix: "$",
    },
    {
      label: "Paid to numbers",
      value: usd(stats.paidOutUsd, 0).slice(1),
      prefix: "$",
    },
    { label: "Answer rate", value: `${stats.answerRatePct}`, suffix: "%" },
  ];

  return (
    /* one banded strip with dividers, rather than four separate cards */
    <Card
      sheen
      className="animate-section-in grid grid-cols-2 divide-primary/[0.06] sm:grid-cols-4 sm:divide-x"
    >
      {items.map((s, i) => (
        <div
          key={s.label}
          className="animate-card-in motion-reduce:animate-none flex flex-col items-start gap-1 px-5 py-5"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <RollingNumber
            value={s.value}
            size={28}
            prefix={s.prefix}
            suffix={s.suffix}
            className="text-[26px] text-primary"
          />
          <span className="text-xs text-secondary">{s.label}</span>
        </div>
      ))}
    </Card>
  );
}
