"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, EmptyState } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { TokenMark } from "@/components/ui/token-mark";
import { ArrowRightIcon, WhatsAppIcon } from "@/components/icons";
import { PAYOUTS, getToken, usd } from "@/lib/data";

type Threshold = "all" | "100" | "500" | "1000";

const MIN: Record<Threshold, number> = {
  all: 0,
  "100": 100,
  "500": 500,
  "1000": 1000,
};

export function PayoutsBrowser() {
  const [threshold, setThreshold] = useState<Threshold>("all");

  const items = useMemo(
    () => PAYOUTS.filter((p) => p.amount >= MIN[threshold]),
    [threshold],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-primary">Latest payouts</h2>
        <Segmented<Threshold>
          size="sm"
          value={threshold}
          onChange={setThreshold}
          options={[
            { id: "all", label: "All" },
            { id: "100", label: "$100+" },
            { id: "500", label: "$500+" },
            { id: "1000", label: "$1K+" },
          ]}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title={
            PAYOUTS.length === 0 ? "No payouts yet" : "No payouts that size"
          }
          description={
            PAYOUTS.length === 0
              ? "Every payout leaves a receipt here once the first fees are claimed and delivered"
              : "Lower the threshold, the list fills as fees are claimed and sent"
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((p, i) => {
            const token = getToken(p.tokenId);
            return (
              <Link
                key={p.id}
                href={`/token/${p.tokenId}`}
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
                      {usd(p.amount, 0)}
                    </span>
                    <span className="truncate text-xs text-secondary">
                      sent to{" "}
                      <span className="tnum text-primary/80">{p.phone}</span>
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
                    <span className="flex size-8 items-center justify-center rounded-full bg-brand/15">
                      <WhatsAppIcon className="size-4 text-brand" />
                    </span>
                    <span className="tnum w-8 text-right text-xs text-secondary">
                      {p.ago}
                    </span>
                    <ArrowRightIcon className="size-3.5 text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
