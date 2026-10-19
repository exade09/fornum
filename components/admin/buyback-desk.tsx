"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/**
 * Buyback of the Fornum token
 *
 * What Fornum's share has bought and burned so far, what is still waiting on
 * launch wallets, and a button for the runs that did not go through on their
 * own after a claim
 */
export function BuybackDesk({
  mint,
  waiting,
  spent,
  burned,
  count,
}: {
  mint: string | null;
  waiting: string;
  spent: string;
  burned: string;
  count: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function run() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setError("");

    const res = await fetch("/api/admin/buyback", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusy(false);

    if (!res.ok) {
      setError(body.error ?? "Could not run the buybacks");
      return;
    }
    const results = (body.results ?? []) as { ok: boolean; error?: string }[];
    const done = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    if (results.length === 0) setMessage("Nothing was ready to buy");
    else setMessage(`${done} done${failed.length ? `, ${failed.length} failed: ${failed[0].error}` : ""}`);
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-normal text-primary">Buyback</h2>
        <p className="text-sm text-secondary">
          Fornum&apos;s 20% of every other coin buys the Fornum token and burns it, right after
          each claim. A share under 0.001 SOL waits for the next one
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Fornum token" value={mint ?? "FORNUM_TOKEN_MINT is not set"} ok={Boolean(mint)} mono />
        <Stat label="Waiting on launch wallets" value={waiting} ok />
        <Stat label="Spent on buybacks" value={`${spent} in ${count} ${count === 1 ? "buy" : "buys"}`} ok />
        <Stat label="Tokens burned" value={burned} ok />
      </div>

      {error && <p className="text-xs text-error">{error}</p>}
      {message && <p className="text-xs text-secondary">{message}</p>}

      <div>
        <button
          type="button"
          onClick={run}
          disabled={!mint || busy}
          className={cn(
            "flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {busy ? "Buying" : "Run waiting buybacks"}
        </button>
      </div>
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
