import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, StaleNotice } from "@/components/shell/page-hero";
import { QueueBrowser } from "@/components/queue/queue-browser";
import { Avatar, Card, StatusChip } from "@/components/ui/primitives";
import { REQUESTS, usd } from "@/lib/mock";

export const metadata: Metadata = { title: "Queue" };

export default function QueuePage() {
  const trending = [...REQUESTS]
    .sort((a, b) => b.answered - a.answered)
    .slice(0, 5);

  return (
    <>
      <PageHero
        title="Очередь заявок"
        description="Каждая заявка — аккаунт в программе. Позиция читается прямо из цепочки, статус меняется по факту дозвона."
        action={
          <Link
            href="/create"
            className="flex h-11 shrink-0 items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
          >
            Создать заявку
          </Link>
        }
      />

      <section className="mx-auto w-full px-4 pt-8 lg:px-6 xl:max-w-7xl">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-primary">В эфире сейчас</h2>
          <span className="text-sm text-secondary">
            {trending.length} из {REQUESTS.length}
          </span>
        </div>

        {/* горизонтальная лента — прокручивается внутри себя, страница не едет */}
        <div className="-mx-4 overflow-x-auto px-4 pb-2 lg:-mx-6 lg:px-6">
          <div className="flex gap-3">
            {trending.map((r, i) => (
              <Link
                key={r.id}
                href={`/request/${r.id}`}
                className="animate-card-in motion-reduce:animate-none shrink-0"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Card
                  lift
                  sheen
                  className="flex w-[240px] items-center gap-3 p-3"
                >
                  <Avatar seed={r.ticker} rounded="xl" className="size-9" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-bold text-primary">
                      {r.ticker}
                    </span>
                    <span className="tnum truncate text-xs text-secondary">
                      {usd(r.settled)} выплачено
                    </span>
                  </div>
                  <StatusChip
                    status={r.status}
                    pulse={r.status === "dialing"}
                    className="ml-auto"
                  />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <StaleNotice>
        Показаны последние подтверждённые заявки, пока стрим догоняет цепочку.
      </StaleNotice>

      <section className="mx-auto w-full px-4 pt-4 pb-10 lg:px-6 xl:max-w-7xl">
        <QueueBrowser />
      </section>
    </>
  );
}
