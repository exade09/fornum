import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, StaleNotice } from "@/components/shell/page-hero";
import { TokensBrowser } from "@/components/tokens/tokens-browser";
import { Card } from "@/components/ui/primitives";
import { TokenMark } from "@/components/ui/token-mark";
import { TOKENS, compactUsd, usd } from "@/lib/data";

export const metadata: Metadata = { title: "Tokens" };

export default function TokensPage() {
  const top = [...TOKENS].sort((a, b) => b.feesClaimed - a.feesClaimed).slice(0, 5);

  return (
    <>
      <PageHero
        title="Tokens launched here"
        description="Every token on this page was deployed through Fornum, which is why its creator fees have a number to land on"
        action={
          <Link
            href="/launch"
            className="flex h-11 shrink-0 items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
          >
            Launch a token
          </Link>
        }
      />

      <section className="mx-auto w-full px-4 pt-8 lg:px-6 xl:max-w-7xl">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-primary">Earning the most</h2>
          <Link
            href="/payouts"
            className="text-sm text-secondary transition-colors hover:text-primary"
          >
            See payouts
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-2 lg:-mx-6 lg:px-6">
          <div className="flex gap-3">
            {top.map((t, i) => (
              <Link
                key={t.id}
                href={`/token/${t.id}`}
                className="animate-card-in motion-reduce:animate-none shrink-0"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Card lift sheen className="flex w-[230px] items-center gap-3 p-3">
                  <TokenMark symbol={t.symbol} size="md" className="size-9" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-bold text-primary">
                      {t.symbol}
                    </span>
                    <span className="tnum truncate text-xs text-secondary">
                      {compactUsd(t.marketCap)} cap
                    </span>
                  </div>
                  <span className="tnum ml-auto shrink-0 text-sm font-bold text-brand">
                    {usd(t.feesClaimed, 0)}
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <StaleNotice>
        Showing the last confirmed state while the stream catches up with the
        chain
      </StaleNotice>

      <section className="mx-auto w-full px-4 pt-4 pb-10 lg:px-6 xl:max-w-7xl">
        <TokensBrowser />
      </section>
    </>
  );
}
