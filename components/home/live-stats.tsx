import Link from "next/link";
import { ArrowRightIcon, PhoneIcon } from "@/components/icons";
import { RollingNumber } from "@/components/ui/rolling-number";
import { Card } from "@/components/ui/primitives";
import { getStats, num, usd } from "@/lib/data";
import { cn } from "@/lib/cn";

/** Live state of the queue, the one thing worth interrupting the hero for */
export function LiveCallBadge() {
  const stats = getStats();
  const idle = stats.callsLive === 0 && stats.callsInQueue === 0;
  const label = idle
    ? "The line is open, nothing in the queue yet"
    : stats.callsLive > 0
      ? `${num(stats.callsLive)} ${stats.callsLive === 1 ? "call" : "calls"} on the line, ${num(stats.callsInQueue)} waiting`
      : `${num(stats.callsInQueue)} ${stats.callsInQueue === 1 ? "call" : "calls"} in the queue`;

  return (
    <Link
      href="/queue"
      className="group relative inline-flex items-center gap-2 rounded-full border border-primary/[0.08] bg-card px-3 py-1.5 text-xs text-secondary transition-colors hover:border-primary/20 hover:text-primary"
    >
      <span className="relative flex size-2 items-center justify-center">
        {!idle && (
          <span className="animate-ring-pulse motion-reduce:animate-none absolute size-2 rounded-full bg-brand" />
        )}
        <span
          className={cn(
            "size-2 rounded-full",
            idle ? "bg-secondary" : "bg-brand",
          )}
        />
      </span>
      <PhoneIcon className="size-3.5 text-brand" />
      <span className="tnum">{label}</span>
      <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Headline numbers, driven by real activity unless an override is set */
export function HeroStats() {
  const stats = getStats();

  const items: {
    label: string;
    value: string;
    prefix?: string;
    suffix?: string;
  }[] = [
    { label: "Tokens launched", value: num(stats.tokensLaunched) },
    {
      label: "Fees claimed",
      value: usd(stats.feesClaimedUsd, 0).slice(1),
      prefix: "$",
    },
    {
      label: "Paid to numbers",
      value: usd(stats.paidOutUsd, 0).slice(1),
      prefix: "$",
    },
  ];

  return (
    /* one banded strip with dividers, rather than four separate cards */
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
          <RollingNumber
            value={s.value}
            size={28}
            prefix={s.prefix}
            suffix={s.suffix}
            className="text-[26px] text-primary"
          />
          <span className="text-xs text-secondary">{s.label}</span>
        </div>
      ))}
    </Card>
  );
}
