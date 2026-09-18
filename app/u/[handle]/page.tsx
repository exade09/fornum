import type { Metadata } from "next";
import Link from "next/link";
import {
  Avatar,
  Card,
  StatusChip,
  hueFrom,
} from "@/components/ui/primitives";
import { CheckIcon, PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { PROFILES, REQUESTS, getProfile, usd } from "@/lib/mock";
import { cn } from "@/lib/cn";

export function generateStaticParams() {
  return PROFILES.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({
  params,
}: PageProps<"/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  return { title: getProfile(handle).name };
}

export default async function ProfilePage({ params }: PageProps<"/u/[handle]">) {
  const { handle } = await params;
  const p = getProfile(handle);
  const hue = hueFrom(p.wallet);
  const own = REQUESTS.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-10 lg:px-6">
      <Card sheen className="animate-section-in overflow-hidden p-0">
        {/* баннер — градиент по адресу кошелька, без картинок */}
        <div
          className="relative h-40"
          style={{
            background: `radial-gradient(120% 140% at 20% 0%, hsl(${hue} 70% 32%), hsl(${
              (hue + 60) % 360
            } 60% 12%) 60%, hsl(var(--card)))`,
          }}
        >
          <span className="animate-orb-float motion-reduce:animate-none absolute top-6 right-10 size-24 rounded-full bg-brand/20 blur-2xl" />
        </div>

        <div className="relative px-6 pb-6">
          <Avatar
            seed={p.wallet}
            className="-mt-12 size-24 ring-4 ring-card"
          />

          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-2">
                <span className="text-xl font-bold text-primary">{p.name}</span>
                {p.verified && (
                  <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                    <CheckIcon className="size-2.5" />
                    Подтверждён
                  </span>
                )}
              </span>
              <span className="font-mono text-xs text-secondary">
                {p.wallet.slice(0, 6)}…{p.wallet.slice(-6)}
              </span>
            </div>

            <Link
              href="/create"
              className="flex h-10 items-center rounded-full border px-5 text-sm font-bold whitespace-nowrap text-primary transition-colors hover:bg-background/70"
            >
              Отправить комиссии
            </Link>
          </div>

          <p className="mt-3 max-w-[58ch] text-sm text-secondary">{p.bio}</p>

          <div className="mt-4 flex gap-8">
            <span className="flex items-baseline gap-1.5">
              <span className="tnum text-base font-bold text-primary">
                {p.requests}
              </span>
              <span className="text-sm text-secondary">заявок</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="tnum text-base font-bold text-primary">
                {usd(p.received)}
              </span>
              <span className="text-sm text-secondary">получено</span>
            </span>
          </div>
        </div>
      </Card>

      {/* подтверждённые номера */}
      <Card
        className="animate-section-in mt-3 flex flex-col gap-3 p-5"
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">
            Подтверждённые номера
          </span>
          <Link
            href="/opt-out"
            className="text-xs text-secondary transition-colors hover:text-primary"
          >
            Отозвать согласие
          </Link>
        </div>

        {p.numbers.map((n, i) => (
          <div
            key={n.masked}
            className="animate-card-in motion-reduce:animate-none flex items-center gap-3 rounded-xl border border-primary/[0.06] bg-background/70 px-4 py-3"
            style={{ animationDelay: `${100 + i * 60}ms` }}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                n.active ? "bg-brand/15" : "bg-primary/10",
              )}
            >
              <WhatsAppIcon
                className={cn(
                  "size-4",
                  n.active ? "text-brand" : "text-secondary",
                )}
              />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="tnum truncate text-sm text-primary">
                {n.masked}
              </span>
              <span className="truncate text-xs text-secondary">
                подтверждён {n.confirmedAgo}
              </span>
            </div>
            <span
              className={cn(
                "ml-auto rounded-full px-2.5 py-1 text-[11px] font-bold",
                n.active
                  ? "bg-brand/15 text-brand"
                  : "bg-primary/10 text-secondary",
              )}
            >
              {n.active ? "Активен" : "Отозван"}
            </span>
          </div>
        ))}
      </Card>

      {/* заявки профиля */}
      <Card
        className="animate-section-in mt-3 flex flex-col gap-3 p-5"
        style={{ animationDelay: "120ms" }}
      >
        <span className="text-sm font-bold text-primary">Заявки</span>
        {own.map((r, i) => (
          <Link
            key={r.id}
            href={`/request/${r.id}`}
            className="animate-card-in motion-reduce:animate-none group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-background/70"
            style={{ animationDelay: `${160 + i * 55}ms` }}
          >
            <Avatar seed={r.ticker} rounded="xl" className="size-9" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold text-primary">
                {r.ticker}
              </span>
              <span className="flex items-center gap-1 truncate text-xs text-secondary">
                <PhoneIcon className="size-3" />
                {r.answered.toLocaleString("en-US")} дозвонов
              </span>
            </div>
            <span className="tnum ml-auto text-sm font-bold text-primary">
              {usd(r.amount)}
            </span>
            <StatusChip status={r.status} />
          </Link>
        ))}
      </Card>
    </div>
  );
}
