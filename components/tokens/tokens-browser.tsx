"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import {
  Card,
  EmptyState,
  Progress,
  TokenChip,
} from "@/components/ui/primitives";
import { TokenMark } from "@/components/ui/token-mark";
import { CheckIcon, SearchIcon, WhatsAppIcon } from "@/components/icons";
import { TOKENS, compactUsd, num, usd, type Token } from "@/lib/data";
import { cn } from "@/lib/cn";

type Filter = "all" | "live" | "pending";
type SortKey = "fees" | "cap" | "new";

export function TokensBrowser() {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("fees");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOKENS.filter((t) => {
      if (filter === "live") return t.status !== "pending";
      if (filter === "pending") return t.status === "pending";
      return true;
    })
      .filter(
        (t) =>
          !q ||
          t.symbol.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.mint.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (sort === "cap") return b.marketCap - a.marketCap;
        if (sort === "new") return a.ageMinutes - b.ageMinutes;
        return b.feesClaimed - a.feesClaimed;
      });
  }, [filter, sort, query]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "All" },
            { id: "live", label: "Routing" },
            { id: "pending", label: "Fees waiting" },
          ]}
        />

        <label className="relative flex h-10 min-w-0 flex-1 items-center sm:max-w-[300px]">
          <SearchIcon className="pointer-events-none absolute left-4 size-4 text-secondary" />
          <span className="sr-only">Search by ticker, name or mint</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ticker, name or mint"
            className="h-10 w-full rounded-full border border-primary/[0.06] bg-card pr-4 pl-11 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          />
        </label>

        <Segmented<SortKey>
          size="sm"
          className="ml-auto"
          value={sort}
          onChange={setSort}
          options={[
            { id: "fees", label: "Fees" },
            { id: "cap", label: "Market cap" },
            { id: "new", label: "Newest" },
          ]}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing matches"
          description="Try another ticker or clear the filters, the list updates as new tokens launch"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((t, i) => (
            <TokenCard key={t.id} token={t} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function TokenCard({ token: t, index }: { token: Token; index: number }) {
  const paidRatio = t.feesClaimed > 0 ? t.feesPaid / t.feesClaimed : 0;

  return (
    <Link
      href={`/token/${t.id}`}
      className="animate-card-in motion-reduce:animate-none"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <Card lift sheen className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <TokenMark symbol={t.symbol} size="lg" className="size-10" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold text-primary">
              {t.symbol}
            </span>
            <span className="truncate text-xs text-secondary">{t.name}</span>
          </div>
          <TokenChip status={t.status} className="ml-auto" />
        </div>

        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              FEES CLAIMED
            </span>
            <span className="tnum text-lg font-bold text-brand">
              {usd(t.feesClaimed, 0)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              MARKET CAP
            </span>
            <span className="tnum text-lg font-bold text-primary">
              {compactUsd(t.marketCap)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Progress value={paidRatio} />
          <div className="flex items-center justify-between text-[11px] text-secondary">
            <span className="tnum">{usd(t.feesPaid, 0)} paid out</span>
            <span className="tnum">{num(t.holders)} holders</span>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-primary/[0.06] pt-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/15">
            <WhatsAppIcon className="size-3.5 text-brand" />
          </span>
          <span className="tnum truncate text-xs text-secondary">
            {t.recipient}
          </span>
          <span
            className={cn(
              "ml-auto flex shrink-0 items-center gap-1 text-[11px] font-bold",
              t.recipientConfirmed ? "text-brand" : "text-queued",
            )}
          >
            {t.recipientConfirmed && <CheckIcon className="size-3" />}
            {t.recipientConfirmed ? "Confirmed" : "Waiting"}
          </span>
        </div>
      </Card>
    </Link>
  );
}
