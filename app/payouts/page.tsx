import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, StaleNotice } from "@/components/shell/page-hero";
import { PayoutsBrowser } from "@/components/payouts/payouts-browser";
import { Card } from "@/components/ui/primitives";
import { RollingNumber } from "@/components/ui/rolling-number";
import { TokenMark } from "@/components/ui/token-mark";
import { TOKENS, getStats, num, usd } from "@/lib/data";

export const metadata: Metadata = { title: "Payouts" };

export default function PayoutsPage() {
  const stats = getStats();
  const top = [...TOKENS].sort((a, b) => b.feesPaid - a.feesPaid).slice(0, 6);

  return (
    <>
      <PageHero
        title="Payouts"
        description="Creator fees from tokens launched here, claimed on chain and sent to the number the launch pointed at"
      />
      <StaleNotice>
        Balances as of the last claim, refreshed every minute
      </StaleNotice>

      <section className="mx-auto grid w-full gap-3 px-4 pt-6 pb-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-6 xl:max-w-7xl">
        <div className="flex flex-col gap-3">
          <Card sheen className="animate-section-in p-6 sm:p-8">
            <span className="text-sm text-secondary">Paid to numbers</span>
            <div className="mt-1">
              <RollingNumber
                value={usd(stats.paidOutUsd, 2).slice(1)}
                prefix="$"
                size={44}
                className="font-display text-[44px] text-primary"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-x-12 gap-y-4">
              <div className="flex flex-col">
                <span className="text-xs text-secondary">Claimed so far</span>
                <span className="tnum text-base font-bold text-primary">
                  {usd(stats.feesClaimedUsd, 0)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-secondary">Held in escrow</span>
                <span className="tnum text-base font-bold text-queued">
                  {usd(stats.inEscrowUsd, 0)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-secondary">Tokens paying</span>
                <span className="tnum text-base font-bold text-primary">
                  {num(stats.tokensLaunched)}
                </span>
              </div>
            </div>
          </Card>

          <PayoutsBrowser />
        </div>

        <Card
          className="animate-section-in flex h-fit flex-col gap-3 p-5"
          style={{ animationDelay: "80ms" }}
        >
          <span className="text-sm font-bold text-primary">Top earners</span>
          {top.map((t, i) => (
            <Link
              key={t.id}
              href={`/token/${t.id}`}
              className="animate-card-in motion-reduce:animate-none flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-background/70"
              style={{ animationDelay: `${120 + i * 55}ms` }}
            >
              <TokenMark symbol={t.symbol} size="md" className="size-8" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-bold text-primary">
                  {t.symbol}
                </span>
                <span className="tnum truncate text-[11px] text-secondary">
                  {t.recipient}
                </span>
              </div>
              <span className="tnum ml-auto text-sm font-bold text-brand">
                {usd(t.feesPaid, 0)}
              </span>
            </Link>
          ))}
        </Card>
      </section>
    </>
  );
}
