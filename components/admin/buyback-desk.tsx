"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export type BuybackJobView = {
  id: string;
  state: string;
  market: string | null;
  signature: string | null;
  reserved: string;
  maxQuote: string | null;
  spent: string | null;
  network: string | null;
  burned: string | null;
  error: string | null;
  createdAt: string;
};

/**
 * The buyback of the Fornum token
 *
 * The treasury's ledger, the last jobs with their states, and a button for a
 * pass now. A job shows as burned only once its finalized receipt shows the
 * burn; simulated, signed and submitted are shown as what they are
 */
export function BuybackDesk({
  enabled,
  treasury,
  mint,
  problems,
  lastPass,
  available,
  reserved,
  pending,
  manual,
  spent,
  network,
  burned,
  jobs,
}: {
  enabled: boolean;
  treasury: string | null;
  mint: string | null;
  problems: string[];
  lastPass?: string | null;
  available: string;
  reserved: string;
  pending: number;
  manual: number;
  spent: string;
  network: string;
  burned: string;
  jobs: BuybackJobView[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function run() {
    if (busy) return;
    setBusy(true);
    setError("");
    setLog([]);
    const res = await fetch("/api/admin/buyback", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(body.error ?? "The pass did not run");
      return;
    }
    const lines = ((body.log ?? []) as { step: string; detail?: string }[]).map(
      (l) => `${l.step}${l.detail ? `: ${l.detail}` : ""}`,
    );
    setLog(lines.length ? lines : ["nothing to do"]);
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-normal text-primary">Buyback</h2>
        <p className="text-sm text-secondary">
          The treasury&apos;s 20% of other coins buys the Fornum token and burns it in the same
          transaction. Only amounts confirmed by a finalized claim receipt are spent
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Sending" value={enabled ? "on" : "off (BUYBACK_ENABLED)"} ok={enabled} />
        <Stat
          label="Last pass"
          value={lastPass ? new Date(lastPass).toLocaleString("en-US") : "never"}
          ok={Boolean(lastPass) && Date.now() - new Date(lastPass!).getTime() < 3 * 60_000}
        />
        <Stat label="Treasury" value={treasury ?? "TREASURY_WALLET is not set"} ok={Boolean(treasury)} mono />
        <Stat label="Fornum token" value={mint ?? "PLATFORM_TOKEN_MINT is not set"} ok={Boolean(mint)} mono />
        <Stat label="In the ledger" value={`${available} available, ${reserved} reserved`} ok />
        <Stat
          label="Claim receipts"
          value={`${pending} waiting for finality, ${manual} for manual review`}
          ok={manual === 0}
        />
        <Stat label="Bought back" value={`${spent} on the market, ${network} network`} ok />
        <Stat label="Burned" value={burned} ok />
      </div>

      {problems.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-queued">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      {jobs.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">Last jobs</span>
          {jobs.map((j) => (
            <div key={j.id} className="flex flex-col gap-0.5 rounded-lg border border-primary/[0.06] p-3 text-xs">
              <span className={cn("font-bold", j.state === "finalized" ? "text-brand" : j.state === "failed" ? "text-error" : "text-queued")}>
                {j.state}
                {j.market ? ` · ${j.market}` : ""} · {new Date(j.createdAt).toLocaleString("en-US")}
              </span>
              <span className="text-secondary">
                reserved {j.reserved}
                {j.maxQuote ? `, ceiling ${j.maxQuote}` : ""}
                {j.spent ? `, spent ${j.spent}` : ""}
                {j.network ? `, network ${j.network}` : ""}
                {j.burned ? `, burned ${j.burned}` : ""}
              </span>
              {j.signature && (
                <a
                  href={`https://solscan.io/tx/${j.signature}`}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-mono text-secondary underline"
                >
                  {j.signature}
                </a>
              )}
              {j.error && <span className="text-queued">{j.error}</span>}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-error">{error}</p>}
      {log.length > 0 && (
        <pre className="max-h-48 overflow-auto rounded-lg bg-field p-3 text-[11px] whitespace-pre-wrap text-secondary">
          {log.join("\n")}
        </pre>
      )}

      <div>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className={cn(
            "flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {busy ? "Running" : "Run a pass now"}
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
