"use client";

import { useState } from "react";
import { Card } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { RollingNumber } from "@/components/ui/rolling-number";

type Frame = "24h" | "7d" | "30d" | "all";

const DATA: Record<
  Frame,
  { calls: string; paid: string; answered: string; bars: number[]; labels: string }
> = {
  "24h": {
    calls: "3,412",
    paid: "7,884.20",
    answered: "62",
    bars: [22, 31, 18, 44, 39, 57, 48, 66, 54, 71, 63, 88],
    labels: "По часам в UTC",
  },
  "7d": {
    calls: "21,908",
    paid: "48,120.75",
    answered: "58",
    bars: [41, 55, 38, 62, 71, 49, 83],
    labels: "По дням в UTC",
  },
  "30d": {
    calls: "96,430",
    paid: "184,902.10",
    answered: "61",
    bars: [18, 32, 24, 41, 38, 52, 47, 63, 55, 71, 66, 84, 78, 92],
    labels: "По дням в UTC",
  },
  all: {
    calls: "148,260",
    paid: "252,101.94",
    answered: "59",
    bars: [12, 19, 28, 24, 36, 44, 39, 58, 52, 67, 74, 69, 85, 92, 88],
    labels: "По неделям с первой заявки",
  },
};

export function AnalyticsBoard() {
  const [frame, setFrame] = useState<Frame>("30d");
  const d = DATA[frame];

  return (
    <div className="flex flex-col gap-3">
      <Card sheen className="animate-section-in p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="font-display text-xl font-normal text-primary">
            Аналитика протокола
          </h2>
          <Segmented<Frame>
            size="sm"
            value={frame}
            onChange={setFrame}
            options={[
              { id: "24h", label: "24ч" },
              { id: "7d", label: "7д" },
              { id: "30d", label: "30д" },
              { id: "all", label: "Всё время" },
            ]}
          />
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-secondary">Дозвонов</span>
            <RollingNumber
              key={`calls-${frame}`}
              value={d.calls}
              size={40}
              className="font-display text-[40px] text-primary"
            />
            <span className="text-xs text-secondary">
              Только подтверждённые номера
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm text-secondary">Выплачено получателям</span>
            <RollingNumber
              key={`paid-${frame}`}
              value={d.paid}
              prefix="$"
              size={40}
              className="font-display text-[40px] text-primary"
            />
            <span className="text-xs text-secondary">После раскрытия эскроу</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <ChartCard
          key={`chart-calls-${frame}`}
          title="Звонки"
          value={d.calls}
          hint={d.labels}
          bars={d.bars}
        />
        <ChartCard
          key={`chart-rate-${frame}`}
          title="Доля дозвонов"
          value={`${d.answered}%`}
          hint={d.labels}
          bars={[...d.bars].reverse()}
          accent
        />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  value,
  hint,
  bars,
  accent = false,
}: {
  title: string;
  value: string;
  hint: string;
  bars: number[];
  accent?: boolean;
}) {
  return (
    <Card sheen className="animate-section-in flex flex-col p-5">
      <span className="text-sm text-secondary">{title}</span>
      <span className="tnum text-2xl font-bold text-primary">{value}</span>
      <span className="mt-1 text-xs text-secondary">{hint}</span>

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
