import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, StaleNotice } from "@/components/shell/page-hero";
import { Card } from "@/components/ui/primitives";
import { TokenMark } from "@/components/ui/token-mark";
import { ArrowRightIcon } from "@/components/icons";
import { getStats, shortAddress, sol, usdFrom } from "@/lib/data";
import { listClaims, listTokens } from "@/lib/db/store";
import { solPriceUsd } from "@/lib/solana/price";

export const metadata: Metadata = { title: "Claims" };

export default async function ClaimsPage() {
  const [stats, claims, tokens, price] = await Promise.all([
    getStats(),
    listClaims(),
    listTokens(),
    solPriceUsd(),
  ]);

  const symbolOf = (tokenId: string) =>
    tokens.find((t) => t.id === tokenId)?.symbol ?? "?";

  return (
    <>
      <PageHero
        eyebrow="Treasury"
        title="Claims"
        description="Creator fees taken out by the people who launched the tokens. Every row is a transaction you can open on chain"
      />
      <StaleNotice>
        {claims.length > 0
          ? "Every claim here is a settled transfer out of a launch wallet"
          : "Nothing has been claimed yet, so there is nothing to show"}
      </StaleNotice>

      <section className="mx-auto flex w-full flex-col gap-3 px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
        <Card sheen className="animate-section-in p-6 sm:p-8">
          <span className="text-sm text-secondary">Claimed by owners</span>
          <p className="tnum font-display mt-1 text-[44px] leading-none text-primary">
            {sol(stats.feesClaimedLamports)}
          </p>
          {usdFrom(stats.feesClaimedLamports, price) && (
            <span className="tnum text-sm text-secondary">
              {usdFrom(stats.feesClaimedLamports, price)}
            </span>
          )}

          <div className="mt-6 flex flex-wrap gap-x-12 gap-y-4">
            <div className="flex flex-col">
              <span className="text-xs text-secondary">Fees collected</span>
              <span className="tnum text-base font-bold text-primary">
                {sol(stats.feesAccruedLamports)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-secondary">
                Waiting to be taken
              </span>
              <span className="tnum text-base font-bold text-queued">
                {sol(stats.claimableLamports)}
              </span>
            </div>
          </div>
        </Card>

        {claims.length === 0 ? (
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
            {claims.map((c, i) => (
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
                      {sol(c.amountLamports)}
                    </span>
                    <span className="truncate font-mono text-xs text-secondary">
                      {shortAddress(c.wallet, 6, 6)}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="hidden items-center gap-2 sm:flex">
                      <TokenMark
                        symbol={symbolOf(c.tokenId)}
                        size="sm"
                        className="size-7"
                      />
                      <span className="text-xs font-bold text-secondary">
                        {symbolOf(c.tokenId)}
                      </span>
                    </span>
                    {usdFrom(c.amountLamports, price) && (
                      <span className="tnum hidden text-xs text-secondary sm:block">
                        {usdFrom(c.amountLamports, price)}
                      </span>
                    )}
                    <ArrowRightIcon className="size-3.5 text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
