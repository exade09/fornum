"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/**
 * The on-chain 80/20 every new coin is created with
 *
 * Launching needs the treasury and the launch lookup table; this shows both
 * and makes the table once. Coins whose split is not verified yet are listed,
 * their fees are not paid out until it is
 */
export function FeeSplitDesk({
  treasury,
  table,
  tableProblem,
  pending,
  treasuryProblem,
}: {
  treasuryProblem?: string | null;
  treasury: string | null;
  table: string | null;
  tableProblem: string | null;
  pending: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function create() {
    if (busy) return;
    setBusy(true);
    setNote("Creating the table and waiting for it to be final, about 20 seconds");
    const res = await fetch("/api/admin/lookup-table", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    setNote(res.ok ? `Table ${body.table}${body.note ? `: ${body.note}` : ""}` : body.error ?? "Could not create it");
    router.refresh();
  }

  const ready = Boolean(treasury && table && !tableProblem);
  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-normal text-primary">Fee split</h2>
        <p className="text-sm text-secondary">
          Every coin is created with its creator fees split on chain, 80% to its launch wallet and
          20% to the treasury, locked in the same transaction. Launching needs both below
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Treasury" value={treasury ?? treasuryProblem ?? "TREASURY_WALLET is not set"} ok={Boolean(treasury)} mono />
        <Stat
          label="Launch lookup table"
          value={table ? (tableProblem ? `${table}: ${tableProblem}` : table) : "not created yet"}
          ok={Boolean(table && !tableProblem)}
          mono
        />
        <Stat label="Launching" value={ready ? "ready" : "blocked until both are set"} ok={ready} />
        <Stat
          label="Split not verified yet"
          value={pending.length ? pending.join(", ") : "none"}
          ok={pending.length === 0}
        />
      </div>
      {note && <p className="text-xs text-secondary">{note}</p>}
      {(!table || tableProblem) && (
        <div>
          <button
            type="button"
            onClick={create}
            disabled={busy || !treasury}
            className={cn(
              "flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {busy ? "Creating" : "Create the lookup table"}
          </button>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, ok, mono = false }: { label: string; value: string; ok: boolean; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">{label}</span>
      <span className={cn("truncate text-sm", mono && "font-mono text-xs", ok ? "text-brand" : "text-queued")}>
        {value}
      </span>
    </div>
  );
}
