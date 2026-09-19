import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, StaleNotice } from "@/components/shell/page-hero";
import { Card } from "@/components/ui/primitives";
import { RollingNumber } from "@/components/ui/rolling-number";
import { TokenMark } from "@/components/ui/token-mark";
import { ArrowRightIcon } from "@/components/icons";
import { CLAIMS, getStats, getToken, usd } from "@/lib/data";

export const metadata: Metadata = { title: "Claims" };

export default function ClaimsPage() {
  const stats = getStats();

  return (
    <>
      <PageHero
        eyebrow="Treasury"
        title="Claims"
        description="Creator fees taken out by the people who launched the tokens. Every row is a transaction you can open on chain"
      />
      <StaleNotice>
        {stats.feesClaimedUsd > 0
          ? "Balances as of the last claim, refreshed every minute"
          : "Nothing has been claimed yet, so there is nothing to show"}
      </StaleNotice>

      <section className="mx-auto flex w-full flex-col gap-3 px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
        <Card sheen className="animate-section-in p-6 sm:p-8">
          <span className="text-sm text-secondary">Claimed by owners</span>
          <div className="mt-1">
            <RollingNumber
              value={usd(stats.feesClaimedUsd, 2).slice(1)}
              prefix="$"
              size={44}
              className="font-display text-[44px] text-primary"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-x-12 gap-y-4">
            <div className="flex flex-col">
              <span className="text-xs text-secondary">Fees collected</span>
              <span className="tnum text-base font-bold text-primary">
                {usd(stats.feesAccruedUsd, 0)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-secondary">
                Waiting to be taken
              </span>
              <span className="tnum text-base font-bold text-queued">
                {usd(stats.claimableUsd, 0)}
              </span>
            </div>
          </div>
        </Card>

        {CLAIMS.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 border-dashed p-12 text-center">
            <span className="text-sm font-bold text-primary">
              No claims yet
            </span>
            <p className="max-w-[42ch] text-sm text-secondary">
              Each claim leaves a transaction here once somebody takes the fees
              their token earned
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {CLAIMS.map((c, i) => {
              const token = getToken(c.tokenId);
              return (
                <Link
                  key={c.id}
                  href={`/token/${c.tokenId}`}
                  className="animate-card-in motion-reduce:animate-none"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <Card
                    lift
                    sheen
                    className="group flex items-center gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="tnum text-lg font-bold text-primary">
                        {usd(c.amount, 0)}
                      </span>
                      <span className="truncate font-mono text-xs text-secondary">
                        {c.wallet}
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <span className="hidden items-center gap-2 sm:flex">
                        <TokenMark
                          symbol={token?.symbol ?? "?"}
                          size="sm"
                          className="size-7"
                        />
                        <span className="text-xs font-bold text-secondary">
                          {token?.symbol}
                        </span>
                      </span>
                      <span className="tnum w-8 text-right text-xs text-secondary">
                        {c.ago}
                      </span>
                      <ArrowRightIcon className="size-3.5 text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
