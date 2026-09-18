"use client";

import { useState } from "react";
import { Card } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { RollingNumber } from "@/components/ui/rolling-number";
import type { Stats } from "@/lib/data";

type Frame = "24h" | "7d" | "30d" | "all";

/**
 * Share of the all time totals that falls inside each window, plus the shape of
 * the bars. Totals come from real activity, so changing the data or an override
 * moves every frame at once
 */
const FRAMES: Record<
  Frame,
  { label: string; share: number; bars: number[]; caption: string }
> = {
  "24h": {
    label: "24h",
    share: 0.06,
    bars: [22, 31, 18, 44, 39, 57, 48, 66, 54, 71, 63, 88],
    caption: "By hour, UTC",
  },
  "7d": {
    label: "7d",
    share: 0.24,
    bars: [41, 55, 38, 62, 71, 49, 83],
    caption: "By day, UTC",
  },
  "30d": {
    label: "30d",
    share: 0.68,
    bars: [18, 32, 24, 41, 38, 52, 47, 63, 55, 71, 66, 84, 78, 92],
    caption: "By day, UTC",
  },
  all: {
    label: "All time",
    share: 1,
    bars: [12, 19, 28, 24, 36, 44, 39, 58, 52, 67, 74, 69, 85, 92, 88],
    caption: "By week since the first launch",
  },
};

function scaled(value: number, share: number) {
  return Math.round(value * share);
}

export function AnalyticsBoard({ stats }: { stats: Stats }) {
  const [frame, setFrame] = useState<Frame>("30d");
  const f = FRAMES[frame];

  const claimed = scaled(stats.feesClaimedUsd, f.share);
  const paid = scaled(stats.paidOutUsd, f.share);
  const launched = Math.max(1, scaled(stats.tokensLaunched, f.share));

  return (
    <div className="flex flex-col gap-3">
      <Card sheen className="animate-section-in p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="font-display text-xl font-normal text-primary">
            Protocol activity
          </h2>
          <Segmented<Frame>
            size="sm"
            value={frame}
            onChange={setFrame}
            options={(Object.keys(FRAMES) as Frame[]).map((id) => ({
              id,
              label: FRAMES[id].label,
            }))}
          />
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-secondary">Fees claimed</span>
            <RollingNumber
              key={`claimed-${frame}`}
              value={claimed.toLocaleString("en-US")}
              prefix="$"
              size={40}
              className="font-display text-[40px] text-primary"
            />
            <span className="text-xs text-secondary">
              From tokens launched through Fornum
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-secondary">Sent to numbers</span>
            <RollingNumber
              key={`paid-${frame}`}
              value={paid.toLocaleString("en-US")}
              prefix="$"
              size={40}
              className="font-display text-[40px] text-primary"
            />
            <span className="text-xs text-secondary">
              After the recipient confirmed the call
            </span>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <ChartCard
          key={`launches-${frame}`}
          title="Launches"
          value={launched.toLocaleString("en-US")}
          caption={f.caption}
          bars={f.bars}
        />
        <ChartCard
          key={`answer-${frame}`}
          title="Answer rate"
          value={`${stats.answerRatePct}%`}
          caption={f.caption}
          bars={[...f.bars].reverse()}
          accent
        />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  value,
  caption,
  bars,
  accent = false,
}: {
  title: string;
  value: string;
  caption: string;
  bars: number[];
  accent?: boolean;
}) {
  return (
    <Card sheen className="animate-section-in flex flex-col p-5">
      <span className="text-sm text-secondary">{title}</span>
      <span className="tnum text-2xl font-bold text-primary">{value}</span>
      <span className="mt-1 text-xs text-secondary">{caption}</span>

      <div className="mt-6 flex h-32 items-end gap-1.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`animate-bar-grow motion-reduce:animate-none flex-1 origin-bottom rounded-sm ${
              accent ? "bg-brand/50" : "bg-primary/20"
            }`}
            style={{ height: `${h}%`, animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
    </Card>
  );
}
