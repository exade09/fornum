"use client";

import { shortAddress, sol } from "@/lib/format";
import type { LaunchWallet, WalletState } from "@/lib/launch-fleet";
import { cn } from "@/lib/cn";

/**
 * Pick the wallet to launch from
 *
 * Replaces a spreadsheet and a typed number, which is where an index gets
 * reused or mistyped. A used wallet cannot be picked at all, so the mistake
 * that costs a customer their fees is no longer available
 */

const LOOK: Record<
  WalletState,
  { chip: string; dot: string; label: string; pickable: boolean }
> = {
  ready: {
    chip: "border-brand/40 text-primary hover:border-brand hover:bg-brand/10",
    dot: "bg-brand",
    label: "Funded and unused",
    pickable: true,
  },
  used: {
    chip: "border-primary/[0.06] text-secondary/50 line-through cursor-not-allowed",
    dot: "bg-primary/25",
    label: "Already launched from",
    pickable: false,
  },
  unrecorded: {
    chip: "border-warning/50 text-warning hover:bg-warning/10",
    dot: "bg-warning",
    label: "Spent but nothing recorded",
    pickable: true,
  },
  empty: {
    chip: "border-primary/[0.06] text-secondary/40 cursor-not-allowed",
    dot: "bg-primary/15",
    label: "Not funded yet",
    pickable: false,
  },
};

const ORDER: WalletState[] = ["ready", "used", "unrecorded", "empty"];

export function WalletPicker({
  wallets,
  selected,
  onSelect,
}: {
  wallets: LaunchWallet[] | null;
  selected: string;
  onSelect: (index: number) => void;
}) {
  // no phrase configured, so nothing can be derived and nothing can be shown
  // as used. Typing the index stays possible, otherwise a launch could not be
  // recorded at all on a deployment that has not been set up yet
  if (wallets === null) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-warning/40 bg-warning/[0.06] px-4 py-3">
        <p className="text-xs text-warning">
          LAUNCH_WALLETS_MNEMONIC is not set, so the wallets cannot be derived
          or checked against what has already been launched. Type the index and
          keep track of it yourself
        </p>
        <input
          value={selected}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, "");
            if (digits !== "") onSelect(Number(digits));
          }}
          inputMode="numeric"
          placeholder="wallet index, e.g. 37"
          className="tnum h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        />
      </div>
    );
  }

  const counts = ORDER.map((state) => ({
    state,
    n: wallets.filter((w) => w.state === state).length,
  })).filter((c) => c.n > 0);

  const chosen = wallets.find((w) => String(w.index) === selected) ?? null;
  const stranded = wallets.filter((w) => w.state === "unrecorded");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {counts.map(({ state, n }) => (
          <span key={state} className="flex items-center gap-1.5 text-[11px] text-secondary">
            <span className={cn("size-2 rounded-full", LOOK[state].dot)} />
            {n} {LOOK[state].label.toLowerCase()}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.6rem,1fr))] gap-1.5">
        {wallets.map((w) => {
          const look = LOOK[w.state];
          const isSelected = String(w.index) === selected;
          return (
            <button
              key={w.index}
              type="button"
              disabled={!look.pickable}
              onClick={() => onSelect(w.index)}
              title={`${w.address}\n${sol(w.lamports)}${w.symbol ? ` · ${w.symbol}` : ""}`}
              className={cn(
                "tnum flex h-9 items-center justify-center rounded-lg border text-xs font-bold transition-colors",
                look.chip,
                isSelected && "border-brand bg-brand text-background hover:bg-brand",
              )}
            >
              {w.index}
            </button>
          );
        })}
      </div>

      {chosen && (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-primary/[0.06] bg-card px-3 py-2">
          <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
            Wallet {chosen.index}
          </span>
          <span className="font-mono text-xs text-primary">
            {shortAddress(chosen.address)}
          </span>
          <span className="tnum text-xs text-secondary">
            {sol(chosen.lamports)}
          </span>
        </div>
      )}

      {stranded.length > 0 && (
        <p className="text-xs text-warning">
          {stranded.length === 1
            ? `Wallet ${stranded[0].index} has spent money with no launch recorded against it. Check whether a coin went out from it before using it`
            : `${stranded.length} wallets have spent money with no launch recorded against them. Check them before using any`}
        </p>
      )}
    </div>
  );
}
