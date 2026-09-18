"use client";

import { useMemo, useState } from "react";
import { Avatar, Card, EmptyState } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { ArrowRightIcon, WhatsAppIcon } from "@/components/icons";
import { PAYOUTS, usd } from "@/lib/mock";

type Threshold = "all" | "10" | "25" | "100";

const MIN: Record<Threshold, number> = { all: 0, "10": 10, "25": 25, "100": 100 };

export function PayoutsBrowser() {
  const [threshold, setThreshold] = useState<Threshold>("all");

  const items = useMemo(
    () => PAYOUTS.filter((p) => p.amount >= MIN[threshold]),
    [threshold],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-primary">Последние выплаты</h2>
        <Segmented<Threshold>
          size="sm"
          value={threshold}
          onChange={setThreshold}
          options={[
            { id: "all", label: "Все" },
            { id: "10", label: "$10+" },
            { id: "25", label: "$25+" },
            { id: "100", label: "$100+" },
          ]}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Выплат такого размера пока не было"
          description="Понизьте порог — лента обновляется по мере раскрытия эскроу."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((p, i) => (
            <a
              key={p.receipt}
              href={`/receipt/${p.receipt}`}
              className="animate-card-in motion-reduce:animate-none"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <Card lift sheen className="group flex items-center gap-3 px-4 py-3">
                <div className="flex min-w-0 flex-col">
                  <span className="tnum text-lg font-bold text-primary">
                    {usd(p.amount)}
                  </span>
                  <span className="truncate text-xs text-secondary">
                    получатель{" "}
                    <span className="tnum text-primary/80">{p.phone}</span>
                  </span>
                </div>

                <div className="ml-auto flex items-center gap-3">
                  <span className="hidden items-center gap-2 sm:flex">
                    <Avatar seed={p.ticker} rounded="xl" className="size-7" />
                    <span className="text-xs font-bold text-secondary">
                      {p.ticker}
                    </span>
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand/15">
                    <WhatsAppIcon className="size-4 text-brand" />
                  </span>
                  <span className="tnum w-8 text-right text-xs text-secondary">
                    {p.ago}
                  </span>
                  <ArrowRightIcon className="size-3.5 text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
