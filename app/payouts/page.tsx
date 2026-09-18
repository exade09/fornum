import type { Metadata } from "next";
import { PageHero, StaleNotice } from "@/components/shell/page-hero";
import { PayoutsBrowser } from "@/components/payouts/payouts-browser";
import { Avatar, Card } from "@/components/ui/primitives";
import { RollingNumber } from "@/components/ui/rolling-number";
import { PAYOUTS, usd } from "@/lib/mock";

export const metadata: Metadata = { title: "Payouts" };

export default function PayoutsPage() {
  const top = [...PAYOUTS]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  return (
    <>
      <PageHero
        title="Выплаты"
        description="Эскроу раскрывается по факту дозвона: деньги уходят на подтверждённый номер, а на каждую выплату остаётся публичный чек."
      />
      <StaleNotice>
        Балансы на 18.09.2026 18:40 UTC, обновление раз в минуту.
      </StaleNotice>

      <section className="mx-auto grid w-full gap-3 px-4 pt-6 pb-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-6 xl:max-w-7xl">
        <div className="flex flex-col gap-3">
          <Card sheen className="animate-section-in p-6 sm:p-8">
            <span className="text-sm text-secondary">Всего выплачено</span>
            <div className="mt-1">
              <RollingNumber
                value="321,000.00"
                prefix="$"
                size={44}
                className="font-display text-[44px] text-primary"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-x-12 gap-y-4">
              <div className="flex flex-col">
                <span className="text-xs text-secondary">В эскроу сейчас</span>
                <span className="tnum text-base font-bold text-primary">
                  {usd(57130.22)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-secondary">Выплат за сутки</span>
                <span className="tnum text-base font-bold text-primary">
                  1,284
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-secondary">Обновлено</span>
                <span className="text-base font-bold text-primary">
                  5m назад
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
          <span className="text-sm font-bold text-primary">
            Крупнейшие выплаты
          </span>
          {top.map((p, i) => (
            <div
              key={p.receipt}
              className="animate-card-in motion-reduce:animate-none flex items-center gap-3"
              style={{ animationDelay: `${120 + i * 55}ms` }}
            >
              <Avatar seed={p.ticker} rounded="xl" className="size-8" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-bold text-primary">
                  {p.ticker}
                </span>
                <span className="tnum truncate text-[11px] text-secondary">
                  {p.phone}
                </span>
              </div>
              <span className="tnum ml-auto text-sm font-bold text-primary">
                {usd(p.amount)}
              </span>
            </div>
          ))}
        </Card>
      </section>
    </>
  );
}
