"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import {
  Avatar,
  Card,
  Progress,
  StatusChip,
  EmptyState,
} from "@/components/ui/primitives";
import { PhoneIcon, SearchIcon } from "@/components/icons";
import { REQUESTS, usd, type Request } from "@/lib/mock";
import { cn } from "@/lib/cn";

type KindFilter = "all" | "alert" | "gift";
type SortKey = "queue" | "amount" | "recent";

export function QueueBrowser() {
  const [kind, setKind] = useState<KindFilter>("all");
  const [sort, setSort] = useState<SortKey>("queue");
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return REQUESTS.filter((r) => kind === "all" || r.kind === kind)
      .filter(
        (r) =>
          !q ||
          r.ticker.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.pda.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        if (sort === "amount") return b.amount - a.amount;
        if (sort === "queue") return a.queue - b.queue;
        return 0;
      });
  }, [kind, sort, query]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented<KindFilter>
          value={kind}
          onChange={setKind}
          options={[
            { id: "all", label: "Все" },
            { id: "alert", label: "Алерты" },
            { id: "gift", label: "Переводы" },
          ]}
        />

        <label className="relative flex h-10 min-w-0 flex-1 items-center sm:max-w-[320px]">
          <SearchIcon className="pointer-events-none absolute left-4 size-4 text-secondary" />
          <span className="sr-only">Поиск по тикеру или адресу заявки</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Тикер или адрес заявки"
            className="h-10 w-full rounded-full border border-primary/[0.06] bg-card pr-4 pl-11 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          />
        </label>

        <Segmented<SortKey>
          size="sm"
          className="ml-auto"
          value={sort}
          onChange={setSort}
          options={[
            { id: "queue", label: "Очередь" },
            { id: "amount", label: "Сумма" },
            { id: "recent", label: "Новые" },
          ]}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Ничего не нашлось"
          description="Попробуйте другой тикер или сбросьте фильтры — очередь обновляется в реальном времени."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((r, i) => (
            <RequestCard key={r.id} request={r} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({ request: r, index }: { request: Request; index: number }) {
  const ratio = r.calls > 0 ? r.answered / r.calls : 0;

  return (
    <Link
      href={`/request/${r.id}`}
      className="animate-card-in motion-reduce:animate-none"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <Card lift sheen className="flex h-full flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <Avatar seed={r.ticker} rounded="xl" className="size-10" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold text-primary">
              {r.ticker}
            </span>
            <span className="truncate text-xs text-secondary">{r.name}</span>
          </div>
          <StatusChip
            status={r.status}
            pulse={r.status === "dialing"}
            className="ml-auto"
          />
        </div>

        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              В ЭСКРОУ
            </span>
            <span className="tnum text-lg font-bold text-primary">
              {usd(r.amount)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              ПОЗИЦИЯ
            </span>
            <span className="tnum text-lg font-bold text-queued">#{r.queue}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Progress value={ratio} />
          <div className="flex items-center justify-between text-[11px] text-secondary">
            <span className="tnum">
              {r.answered.toLocaleString("en-US")} из{" "}
              {r.calls.toLocaleString("en-US")} дозвонов
            </span>
            <span
              className={cn(
                "flex items-center gap-1",
                r.agent === "human" ? "text-dialing" : "text-brand",
              )}
            >
              <PhoneIcon className="size-3" />
              {r.agent === "human" ? "Оператор" : "Робот"}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
