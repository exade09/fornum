import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Avatar,
  Card,
  Field,
  Progress,
  StatusChip,
  type Status,
} from "@/components/ui/primitives";
import { Waveform } from "@/components/ui/waveform";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { REQUESTS, getRequest, usd } from "@/lib/mock";
import { cn } from "@/lib/cn";

export function generateStaticParams() {
  return REQUESTS.map((r) => ({ id: r.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/request/[id]">): Promise<Metadata> {
  const { id } = await params;
  const r = getRequest(id);
  return { title: r ? `${r.ticker} — заявка` : "Заявка" };
}

/** Шаги жизненного цикла заявки — совпадают с инструкциями программы. */
const STEPS = [
  { key: "created", label: "Заявка создана", hint: "create_request" },
  { key: "escrow", label: "Средства в эскроу", hint: "fund_escrow" },
  { key: "verified", label: "Номер подтверждён", hint: "confirm_recipient" },
  { key: "dialed", label: "Дозвон", hint: "mark_delivered" },
  { key: "settled", label: "Выплата", hint: "settle" },
] as const;

const REACHED: Record<Status, number> = {
  queued: 2,
  verifying: 2,
  dialing: 3,
  paid: 5,
  refunded: 2,
};

export default async function RequestPage({ params }: PageProps<"/request/[id]">) {
  const { id } = await params;
  const r = getRequest(id);
  if (!r) notFound();

  const reached = REACHED[r.status];
  const ratio = r.calls > 0 ? r.answered / r.calls : 0;

  return (
    <div className="mx-auto flex w-full flex-col gap-3 px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
      <Link
        href="/queue"
        className="flex w-fit items-center gap-1 text-sm text-secondary transition-colors hover:text-primary"
      >
        <ChevronLeftIcon className="size-4" />
        Назад в очередь
      </Link>

      {/* --- шапка: заявка и получатель --- */}
      <div className="animate-section-in grid gap-3 lg:grid-cols-2">
        <Card sheen className="flex items-center gap-4 p-5">
          <Avatar seed={r.ticker} rounded="xl" className="size-14" />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="truncate text-lg font-bold text-primary">
                {r.ticker}
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
                {r.kind === "alert" ? "АЛЕРТ" : "ПЕРЕВОД"}
              </span>
            </div>
            <span className="truncate text-sm text-secondary">{r.name}</span>
          </div>
          <div className="ml-auto flex flex-col items-end">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              В ЭСКРОУ
            </span>
            <span className="tnum text-xl font-bold text-primary">
              {usd(r.amount)}
            </span>
          </div>
        </Card>

        <Card sheen className="flex items-center gap-4 p-5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand/15">
            <WhatsAppIcon className="size-7 text-brand" />
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="tnum truncate text-lg font-bold text-primary">
              {r.phone}
            </span>
            <span className="flex items-center gap-1 text-sm text-secondary">
              {reached >= 3 ? (
                <>
                  <CheckIcon className="size-3.5 text-brand" />
                  Номер подтверждён
                </>
              ) : (
                "Ждём подтверждения"
              )}
            </span>
          </div>
          <div className="ml-auto flex flex-col items-end">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              ВЫПЛАЧЕНО
            </span>
            <span className="tnum text-xl font-bold text-brand">
              {usd(r.settled)}
            </span>
          </div>
        </Card>
      </div>

      {/* --- главный блок статуса --- */}
      <Card
        sheen
        className="animate-section-in flex flex-col gap-5 p-6"
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip status={r.status} pulse={r.status === "dialing"} />
          <span className="text-sm text-secondary">
            создана {r.createdAgo} назад · исполнитель{" "}
            <span className={r.agent === "human" ? "text-dialing" : "text-brand"}>
              {r.agent === "human" ? "живой оператор" : "робот"}
            </span>
          </span>
          <span className="tnum ml-auto rounded-full bg-background/70 px-3 py-1 text-sm text-secondary">
            позиция #{r.queue}
          </span>
        </div>

        <div className="flex flex-wrap items-end gap-x-12 gap-y-5">
          <Field label="ДОЗВОНОВ" value={r.answered.toLocaleString("en-US")} accent="brand" />
          <Field label="ЗАПЛАНИРОВАНО" value={r.calls.toLocaleString("en-US")} />
          <Field
            label="ОСТАТОК В ЭСКРОУ"
            value={usd(r.amount - r.settled)}
            accent="queued"
          />
          <Field
            label="КОНВЕРСИЯ"
            value={`${Math.round(ratio * 100)}%`}
            accent="dialing"
          />
        </div>

        <Progress value={ratio} />
      </Card>

      {/* --- таймлайн и скрипт --- */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card
          sheen
          className="animate-section-in flex flex-col gap-1 p-6"
          style={{ animationDelay: "120ms" }}
        >
          <h2 className="mb-3 text-sm font-bold text-primary">
            Что уже произошло
          </h2>

          {STEPS.map((step, i) => {
            const done = i < reached;
            const active = i === reached;
            const last = i === STEPS.length - 1;

            return (
              <div key={step.key} className="flex gap-4">
                {/* колонка с точкой и соединителем */}
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "relative flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                      done && "border-brand bg-brand/15 text-brand",
                      active && "border-dialing bg-dialing/15 text-dialing",
                      !done && !active && "border-primary/10 text-secondary",
                    )}
                  >
                    {active && (
                      <span className="animate-ring-pulse motion-reduce:animate-none absolute size-6 rounded-full bg-dialing/40" />
                    )}
                    {done ? (
                      <CheckIcon className="size-3.5" />
                    ) : (
                      <span className="tnum text-[10px]">{i + 1}</span>
                    )}
                  </span>
                  {!last && (
                    <span
                      className={cn(
                        "w-px flex-1",
                        done ? "bg-brand/40" : "bg-primary/10",
                      )}
                    />
                  )}
                </div>

                <div className={cn("flex flex-col pb-6", last && "pb-0")}>
                  <span
                    className={cn(
                      "text-sm",
                      done || active
                        ? "font-bold text-primary"
                        : "text-secondary",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="font-mono text-[11px] text-secondary">
                    {step.hint}
                  </span>
                </div>
              </div>
            );
          })}
        </Card>

        <div className="flex flex-col gap-3">
          <Card
            sheen
            className="animate-section-in flex flex-col gap-3 p-5"
            style={{ animationDelay: "160ms" }}
          >
            <div className="flex items-center gap-3">
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/15">
                {r.status === "dialing" && (
                  <span className="animate-ring-pulse motion-reduce:animate-none absolute size-10 rounded-full bg-brand/40" />
                )}
                <PhoneIcon className="size-5 text-brand" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-bold text-primary">
                  Текст звонка
                </span>
                <span className="text-xs text-secondary">
                  {r.agent === "human" ? "читает оператор" : "синтез речи"}
                </span>
              </div>
            </div>

            <p className="text-sm text-secondary">{r.script}</p>

            <Waveform
              className="h-10"
              paused={r.status !== "dialing"}
              bars={32}
            />
          </Card>

          <Card
            className="animate-section-in flex flex-col gap-3 p-5"
            style={{ animationDelay: "200ms" }}
          >
            <span className="text-sm font-bold text-primary">Ончейн</span>
            <Row label="PDA заявки" value={r.pda} />
            <Row label="Создатель" value={r.creator} />
            <Row label="Транзакция" value={r.tx} href={`https://solscan.io/tx/${r.tx}`} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <span className="truncate font-mono text-xs text-primary/80 transition-colors group-hover:text-primary">
      {value}
    </span>
  );

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-secondary">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="group flex min-w-0 flex-1 items-center gap-1"
        >
          {content}
          <ArrowRightIcon className="size-3 shrink-0 text-secondary transition-colors group-hover:text-primary" />
        </a>
      ) : (
        <span className="min-w-0 flex-1">{content}</span>
      )}
    </div>
  );
}
