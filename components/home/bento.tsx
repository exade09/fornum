import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  PhoneIcon,
  SearchIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { ACCOUNT_LAYOUT, DEMO_PAYOUTS, DEMO_REQUESTS } from "@/lib/mock";
import { Avatar } from "@/components/ui/primitives";
import { RollingNumber } from "@/components/ui/rolling-number";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Оболочка плитки                                                     */
/* ------------------------------------------------------------------ */

function BentoCard({
  href,
  label,
  row,
  className,
  children,
}: {
  href: string;
  label: string;
  row: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{ "--tile-row": row } as React.CSSProperties}
      className={cn(
        "group/card relative isolate flex h-[280px] flex-col overflow-hidden rounded-2xl border border-primary/[0.06] bg-card transition-all hover:border-primary/20 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <span className="text-sm font-bold text-primary">{label}</span>
        <span className="flex items-center gap-1 text-sm text-secondary transition-colors group-hover/card:text-primary">
          Open
          <ArrowRightIcon className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

/** Общая маска: превью растворяется к нижнему краю, чтобы не спорить с подписью. */
const FADE =
  "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card to-transparent";

/* ------------------------------------------------------------------ */
/* 1. Queue — стена заявок с диагональным паном                        */
/* ------------------------------------------------------------------ */

const WALL_COLS = 4; // колонок в блоке
const WALL_ROWS = 4; // карточек в колонке
const COL_W = 148;
const COL_GAP = 12;
const CARD_H = 92;
const CARD_GAP = 12;
const BLOCK_W = WALL_COLS * (COL_W + COL_GAP);
const BLOCK_H = WALL_ROWS * (CARD_H + CARD_GAP);

function WallCard({ index }: { index: number }) {
  const item = DEMO_REQUESTS[index % DEMO_REQUESTS.length];
  return (
    <div
      className="flex shrink-0 flex-col justify-between rounded-xl border border-primary/[0.06] bg-background/70 p-2.5"
      /* отступ через margin, а не gap: тогда высота колонки ровно
         N*(CARD_H+CARD_GAP) и поле тайлится без шва */
      style={{ width: COL_W, height: CARD_H, marginBottom: CARD_GAP }}
    >
      <div className="flex items-center gap-2">
        <Avatar seed={item.ticker} rounded="xl" className="size-6" />
        <span className="truncate text-[11px] font-bold text-primary">
          {item.ticker}
        </span>
        <span
          className={cn(
            "ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold",
            item.agent === "human"
              ? "bg-dialing/15 text-dialing"
              : "bg-brand/15 text-brand",
          )}
        >
          {item.agent === "human" ? "LIVE" : "BOT"}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="tnum text-[13px] font-bold text-primary">
          {item.amount}
        </span>
        <span className="tnum text-[10px] text-secondary">#{item.queue}</span>
      </div>
    </div>
  );
}

function QueueWall() {
  return (
    <div className="absolute inset-0">
      <div
        className="animate-diag-pan motion-reduce:animate-none absolute top-0 left-0 origin-top-left"
        style={
          {
            "--block-w": `${BLOCK_W}px`,
            "--block-h": `${BLOCK_H}px`,
            "--field-scale": 0.92,
          } as React.CSSProperties
        }
      >
        {/* поле тайлится: 2 блока по горизонтали × 2 по вертикали */}
        <div className="flex">
          {Array.from({ length: WALL_COLS * 2 }, (_, col) => (
            <div
              key={col}
              className="flex flex-col"
              style={{
                width: COL_W,
                marginRight: COL_GAP,
                // смещение нечётных колонок даёт «кирпичную» раскладку
                // и не ломает вертикальный период поля
                marginTop: col % 2 ? -(CARD_H + CARD_GAP) / 2 : 0,
              }}
            >
              {Array.from({ length: WALL_ROWS * 2 }, (_, row) => (
                <WallCard key={row} index={col * 3 + row} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className={FADE} />
    </div>
  );
}

export function QueueTile() {
  return (
    <BentoCard href="/queue" label="Queue" row={0} className="sm:col-span-3">
      <QueueWall />
    </BentoCard>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Payouts — лента выплат, поднимается ступеньками                  */
/* ------------------------------------------------------------------ */

const FEED_ROW_H = 64;

function PayoutRow({ index }: { index: number }) {
  const item = DEMO_PAYOUTS[index % DEMO_PAYOUTS.length];
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-primary/[0.06] bg-background/70 px-3"
      style={{ height: FEED_ROW_H - 8, marginBottom: 8 }}
    >
      <div className="flex min-w-0 flex-col">
        <span className="tnum text-base font-bold text-primary">
          {item.amount}
        </span>
        <span className="truncate text-[11px] text-secondary">
          sent to <span className="tnum text-primary/80">{item.phone}</span>
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Avatar seed={item.ticker} className="size-7" />
        <span className="flex size-7 items-center justify-center rounded-full bg-brand/15">
          <WhatsAppIcon className="size-4 text-brand" />
        </span>
        <span className="tnum w-6 text-right text-[10px] text-secondary">
          {item.ago}
        </span>
      </div>
    </div>
  );
}

export function PayoutsTile() {
  return (
    <BentoCard href="/payouts" label="Payouts" row={0} className="sm:col-span-3">
      <div className="absolute inset-0 px-3 pt-3">
        <div
          className="animate-feed-rise motion-reduce:animate-none"
          style={{ "--feed-step": `${FEED_ROW_H}px` } as React.CSSProperties}
        >
          {Array.from({ length: 14 }, (_, i) => (
            <PayoutRow key={i} index={i} />
          ))}
        </div>
      </div>
      <div className={FADE} />
    </BentoCard>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Analytics — роллинг цифр + сглаженный график                     */
/* ------------------------------------------------------------------ */

export function AnalyticsTile() {
  return (
    <BentoCard
      href="/analytics"
      label="Analytics"
      row={1}
      className="sm:col-span-2"
    >
      <div className="absolute inset-0 flex flex-col p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-secondary">Calls delivered</span>
          <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-secondary">
            30D
          </span>
        </div>

        <RollingNumber
          value="148,260"
          size={34}
          className="mt-2 text-[28px] text-primary"
        />

        <svg
          viewBox="0 0 220 60"
          preserveAspectRatio="none"
          className="mt-auto h-20 w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 48 C 24 44, 36 22, 58 26 S 92 46, 112 38 S 150 10, 176 18 S 206 34, 220 26"
            fill="none"
            stroke="hsl(var(--brand))"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M0 48 C 24 44, 36 22, 58 26 S 92 46, 112 38 S 150 10, 176 18 S 206 34, 220 26 L220 60 L0 60 Z"
            fill="url(#spark)"
          />
        </svg>
      </div>
    </BentoCard>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Create — печатающийся номер и подбор подтверждённых контактов    */
/* ------------------------------------------------------------------ */

export function CreateTile() {
  const matches = [
    { phone: "+7 912 ••• 48 21", label: "Verified", ok: true },
    { phone: "+44 7700 ••• 07", label: "Verified", ok: true },
    { phone: "+91 98 ••• 33 65", label: "Pending", ok: false },
  ];

  return (
    <BentoCard href="/create" label="Create" row={1} className="sm:col-span-2">
      <div className="absolute inset-0 flex flex-col gap-3 p-4">
        <span className="text-[10px] font-bold tracking-wider text-secondary">
          CALL GOES TO
        </span>

        <div className="flex h-10 items-center gap-2 rounded-full border border-primary/[0.06] bg-background/70 px-3">
          <SearchIcon className="size-4 shrink-0 text-secondary" />
          <span className="relative overflow-hidden whitespace-nowrap">
            <span className="animate-type-query motion-reduce:animate-none tnum block overflow-hidden text-sm text-primary">
              +7 912 345 48 21
            </span>
          </span>
          <span className="animate-type-caret motion-reduce:animate-none h-4 w-px bg-primary" />
        </div>

        <div className="flex flex-col gap-1.5">
          {matches.map((m, i) => (
            <div
              key={m.phone}
              className="animate-card-in motion-reduce:animate-none flex items-center gap-2 rounded-lg px-1 py-1"
              style={{ animationDelay: `${300 + i * 140}ms` }}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-brand/15">
                <WhatsAppIcon className="size-4 text-brand" />
              </span>
              <span className="tnum truncate text-xs text-primary">
                {m.phone}
              </span>
              <span
                className={cn(
                  "ml-auto flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                  m.ok
                    ? "bg-brand/15 text-brand"
                    : "bg-queued/15 text-queued",
                )}
              >
                {m.ok && <CheckIcon className="size-2.5" />}
                {m.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className={FADE} />
    </BentoCard>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Docs — байтовая раскладка аккаунта заявки                        */
/* ------------------------------------------------------------------ */

export function DocsTile() {
  return (
    <BentoCard href="/docs" label="Docs" row={1} className="sm:col-span-2">
      <div className="absolute inset-0 flex flex-col gap-2 p-4">
        <span className="text-[10px] font-bold tracking-wider text-secondary">
          REQUEST ACCOUNT
        </span>
        <p className="text-xs leading-snug text-primary">
          Одна заявка — один PDA. Очередь читается прямо из программы, без
          посредника.
        </p>

        <div className="mt-1 overflow-hidden rounded-lg border border-primary/[0.06] bg-background/70 font-mono">
          <div className="flex gap-3 border-b border-primary/[0.06] px-2.5 py-1 text-[9px] text-secondary">
            <span className="w-6">OFF</span>
            <span className="w-6">LEN</span>
            <span>FIELD</span>
          </div>
          {ACCOUNT_LAYOUT.slice(0, 6).map((row) => (
            <div
              key={row.off}
              className="flex gap-3 px-2.5 py-[3px] text-[10px] text-primary/80"
            >
              <span className="tnum w-6 text-secondary">{row.off}</span>
              <span className="tnum w-6 text-secondary">{row.len}</span>
              <span className="truncate">{row.field}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={FADE} />
    </BentoCard>
  );
}

/* ------------------------------------------------------------------ */
/* Сетка                                                               */
/* ------------------------------------------------------------------ */

export function HomeBento() {
  return (
    <div className="row-stagger">
      <section className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
        <div className="grid gap-3 sm:grid-cols-6">
          <QueueTile />
          <PayoutsTile />
          <AnalyticsTile />
          <CreateTile />
          <DocsTile />
        </div>
      </section>
    </div>
  );
}

/* Небольшой хелпер для героя: пульсирующий индикатор активного звонка. */
export function LiveCallBadge() {
  return (
    <span className="relative inline-flex items-center gap-2 rounded-full border border-primary/[0.06] bg-card px-3 py-1 text-xs text-secondary">
      <span className="relative flex size-2 items-center justify-center">
        <span className="animate-ring-pulse motion-reduce:animate-none absolute size-2 rounded-full bg-brand" />
        <span className="size-2 rounded-full bg-brand" />
      </span>
      <PhoneIcon className="size-3.5 text-brand" />
      12 звонков в очереди
    </span>
  );
}
