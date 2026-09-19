import { Card } from "@/components/ui/primitives";
import { getStats, num, sol, usdFrom } from "@/lib/data";
import { solPriceUsd } from "@/lib/solana/price";

/** Headline numbers, from the store unless an override is set */
export async function HeroStats() {
  const [stats, price] = await Promise.all([getStats(), solPriceUsd()]);

  const items: { label: string; value: string; sub?: string | null }[] = [
    { label: "Tokens launched", value: num(stats.tokensLaunched) },
    {
      label: "Fees collected",
      value: sol(stats.feesAccruedLamports),
      sub: usdFrom(stats.feesAccruedLamports, price),
    },
    {
      label: "Claimed by owners",
      value: sol(stats.feesClaimedLamports),
      sub: usdFrom(stats.feesClaimedLamports, price),
    },
  ];

  return (
    /* one banded strip with dividers, rather than separate cards */
    <Card
      sheen
      className="animate-section-in grid grid-cols-1 divide-primary/[0.06] sm:grid-cols-3 sm:divide-x"
    >
      {items.map((s, i) => (
        <div
          key={s.label}
          className="animate-card-in motion-reduce:animate-none flex flex-col items-start gap-1 px-5 py-5"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <span className="tnum font-display text-[26px] text-primary">
            {s.value}
          </span>
          <span className="text-xs text-secondary">
            {s.label}
            {s.sub ? ` · ${s.sub}` : ""}
          </span>
        </div>
      ))}
    </Card>
  );
}
