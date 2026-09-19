"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/icons";
import { sol } from "@/lib/format";
import type { Token } from "@/lib/types";
import { cn } from "@/lib/cn";

const KEY = "fornum:admin-token";
const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * How much of the launch wallet belongs to which token
 *
 * One wallet holds the fees of every token, so until a job watches the chain
 * the operator claims out of pump.fun and then says here what each token has
 * earned. Without this the first claimer would take everybody's money
 */
export function FeesRecorder({ tokens }: { tokens: Token[] }) {
  const [secret, setSecret] = useState("");
  const [tokenId, setTokenId] = useState(tokens[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    try {
      setSecret(window.localStorage.getItem(KEY) ?? "");
    } catch {
      /* private mode, type it again */
    }
  }, []);

  const token = tokens.find((t) => t.id === tokenId);
  const lamports = Math.round(Number(amount) * LAMPORTS_PER_SOL);
  const ready =
    secret.length > 0 &&
    tokenId.length > 0 &&
    Number.isFinite(lamports) &&
    lamports >= 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;

    setBusy(true);
    setError("");
    setSaved("");

    const res = await fetch("/api/admin/fees", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ tokenId, lamports }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not record it");
      return;
    }

    setSaved(sol(lamports));
  }

  if (tokens.length === 0) {
    return (
      <Card className="flex flex-col gap-2 p-6">
        <span className="text-sm font-bold text-primary">Record fees</span>
        <p className="text-sm text-secondary">
          Nothing launched yet. Record a launch first and this is where you say
          what it has earned
        </p>
      </Card>
    );
  }

  return (
    <Card sheen className="animate-section-in flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-normal text-primary">
          Record fees
        </h2>
        <p className="text-sm text-secondary">
          Total the token has earned, in SOL. Claim the creator fees out of
          pump.fun into the launch wallet first, otherwise there is nothing to
          pay out with
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
            Token
          </span>
          <select
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            className="h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 text-sm text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            {tokens.map((t) => (
              <option key={t.id} value={t.id}>
                {t.symbol} · {t.name}
              </option>
            ))}
          </select>
          {token && (
            <span className="tnum text-xs text-secondary">
              now {sol(token.feesAccruedLamports)} collected,{" "}
              {sol(token.feesClaimedLamports)} claimed
            </span>
          )}
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
              Earned in total, SOL
            </span>
            <input
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value.replace(/[^0-9.]/g, ""))
              }
              inputMode="decimal"
              placeholder="0.003"
              className="tnum h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
              Admin token
            </span>
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="ADMIN_TOKEN"
              className="h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 font-mono text-xs text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
          </label>
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!ready || busy}
            className={cn(
              "flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {busy ? "Saving" : "Record"}
          </button>

          {saved && (
            <span className="animate-fade-slide-up motion-reduce:animate-none flex items-center gap-1.5 text-xs text-brand">
              <CheckIcon className="size-3.5" />
              set to {saved}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
