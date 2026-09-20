"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/icons";
import { sol } from "@/lib/format";
import type { Token } from "@/lib/types";
import { cn } from "@/lib/cn";

const KEY = "fornum:admin-token";

/**
 * Take a launch off the list
 *
 * For a launch recorded wrong or a test row that should never have been public.
 * The id has to be typed out rather than picked, because this is the one
 * control here that destroys something
 */
export function TokenRemover({ tokens }: { tokens: Token[] }) {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [tokenId, setTokenId] = useState(tokens[0]?.id ?? "");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [removed, setRemoved] = useState("");

  useEffect(() => {
    try {
      setSecret(window.localStorage.getItem(KEY) ?? "");
    } catch {
      /* private mode, type it again */
    }
  }, []);

  const token = tokens.find((t) => t.id === tokenId);
  const ready = secret.length > 0 && tokenId.length > 0 && confirm === tokenId;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;

    setBusy(true);
    setError("");
    setRemoved("");

    const res = await fetch("/api/admin/token", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ tokenId, confirm }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not remove it");
      return;
    }

    const body = (await res.json()) as { symbol: string };
    setRemoved(body.symbol);
    setConfirm("");
    router.refresh();
  }

  if (tokens.length === 0) {
    return null;
  }

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-normal text-primary">
          Remove a launch
        </h2>
        <p className="text-sm text-secondary">
          Takes the token off the public list along with its claim history. The
          coin itself stays on chain, this only forgets it here
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
            Token
          </span>
          <select
            value={tokenId}
            onChange={(e) => {
              setTokenId(e.target.value);
              setConfirm("");
            }}
            className="h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 text-sm text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            {tokens.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id} · {t.symbol} · {sol(t.feesAccruedLamports)} collected
              </option>
            ))}
          </select>
          {token && (
            <span className="text-xs text-secondary">
              owned by {token.assigneeMasked ?? token.ownerMasked}
            </span>
          )}
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
              Type {tokenId} to confirm
            </span>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={tokenId}
              className="h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 font-mono text-xs text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
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
              "flex h-10 items-center rounded-full border border-error/40 px-5 text-sm font-bold text-error transition-colors hover:bg-error/10",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {busy ? "Removing" : "Remove"}
          </button>

          {removed && (
            <span className="animate-fade-slide-up motion-reduce:animate-none flex items-center gap-1.5 text-xs text-brand">
              <CheckIcon className="size-3.5" />
              {removed} is off the list
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}
