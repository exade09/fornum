"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/icons";
import type { Overrides } from "@/lib/config";
import type { Stats } from "@/lib/data";
import { cn } from "@/lib/cn";

type Key = keyof Overrides;

const FIELDS: {
  key: Key;
  label: string;
  hint: string;
  statKey: keyof Stats;
}[] = [
  {
    key: "tokensLaunched",
    label: "Tokens launched",
    hint: "Counter under the hero and on the claims page",
    statKey: "tokensLaunched",
  },
  {
    key: "feesAccruedUsd",
    label: "Fees collected, USD",
    hint: "Everything the launch wallets have taken in",
    statKey: "feesAccruedUsd",
  },
  {
    key: "feesClaimedUsd",
    label: "Claimed by owners, USD",
    hint: "Big number on the claims page",
    statKey: "feesClaimedUsd",
  },
];

export function StatsControls({
  current,
  overrides,
}: {
  /** what the site shows right now, overrides already applied */
  current: Stats;
  /** what is pinned at the moment, null means computed from activity */
  overrides: Overrides;
}) {
  const [draft, setDraft] = useState<Record<Key, string>>(() => {
    const seed = {} as Record<Key, string>;
    for (const f of FIELDS) {
      const v = overrides[f.key];
      seed[f.key] = typeof v === "number" ? String(v) : "";
    }
    return seed;
  });
  const [copied, setCopied] = useState(false);

  const json = useMemo(() => {
    const out: Record<string, number | null> = {};
    for (const f of FIELDS) {
      const raw = draft[f.key].trim();
      out[f.key] = raw === "" ? null : Number(raw);
    }
    return JSON.stringify({ overrides: out }, null, 2);
  }, [draft]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked, the textarea is still selectable */
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Card sheen className="animate-section-in flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-xl font-normal text-primary">
            Pin a number
          </h2>
          <p className="text-sm text-secondary">
            Leave a field empty and the site shows the real figure from
            activity. Type a value and that value is shown instead
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => {
            const pinned = draft[f.key].trim() !== "";
            return (
              <label key={f.key} className="flex flex-col gap-1.5">
                <span className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-secondary uppercase">
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] normal-case",
                      pinned
                        ? "bg-queued/15 text-queued"
                        : "bg-brand/15 text-brand",
                    )}
                  >
                    {pinned ? "pinned" : "live"}
                  </span>
                </span>
                <input
                  value={draft[f.key]}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      [f.key]: e.target.value.replace(/[^0-9.]/g, ""),
                    }))
                  }
                  inputMode="decimal"
                  placeholder={String(current[f.statKey])}
                  className="tnum h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                />
                <span className="text-xs text-secondary">{f.hint}</span>
              </label>
            );
          })}
        </div>
      </Card>

      <Card
        className="animate-section-in flex flex-col gap-3 p-6"
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-primary">
            Config to apply
          </span>
          <button
            type="button"
            onClick={copy}
            className="flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-bold text-primary transition-colors hover:bg-background/70"
          >
            {copied && <CheckIcon className="size-3.5 text-brand" />}
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>

        <textarea
          readOnly
          value={json}
          rows={11}
          className="w-full resize-none rounded-xl border border-primary/[0.06] bg-field p-4 font-mono text-xs text-primary/90 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        />

        <div className="flex flex-col gap-2 text-sm text-secondary">
          <span className="text-sm font-bold text-primary">
            Two ways to apply it
          </span>
          <p>
            Paste it into content/site-config.json and push, the deploy picks it
            up in under a minute
          </p>
          <p>
            Or set FORNUM_OVERRIDES on the host to the object inside overrides,
            which wins over the file and needs no code change
          </p>
        </div>
      </Card>
    </div>
  );
}
