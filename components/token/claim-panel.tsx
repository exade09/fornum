"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { ArrowRightIcon, CheckIcon, WhatsAppIcon } from "@/components/icons";
import { shortAddress, sol, usdFrom } from "@/lib/format";
import { cn } from "@/lib/cn";

type Mode = "claim" | "hand over";

/**
 * Everything the fee recipient can do with a token: take the money, or point it
 * at somebody else's number
 *
 * Both are gated server side as well. What is rendered here only decides what
 * is worth showing, the routes re-check the session against the token
 */
export function ClaimPanel({
  tokenId,
  lamports,
  recipient,
  canClaim,
  signedIn,
  price,
}: {
  tokenId: string;
  /** claimable right now, lamports */
  lamports: number;
  /** masked number the fees belong to */
  recipient: string;
  canClaim: boolean;
  signedIn: boolean;
  price: number | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("claim");
  const [wallet, setWallet] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | { mode: Mode; detail: string }>(null);

  const walletReady = wallet.trim().length >= 32;
  const phoneReady = phone.replace(/\D/g, "").length >= 8;
  const usdLabel = usdFrom(lamports, price);

  async function claim() {
    if (!walletReady || busy) return;
    setBusy(true);
    setError("");

    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId, wallet: wallet.trim() }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "The claim did not go through");
      return;
    }

    const body = (await res.json()) as { tx: string };
    setDone({ mode: "claim", detail: body.tx });
    router.refresh();
  }

  async function handOver() {
    if (!phoneReady || busy) return;
    setBusy(true);
    setError("");

    const res = await fetch("/api/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId, phone }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not hand them over");
      return;
    }

    const body = (await res.json()) as { assignedTo: string };
    setDone({ mode: "hand over", detail: body.assignedTo });
    router.refresh();
  }

  if (done) {
    return (
      <Card
        sheen
        className="animate-scale-in motion-reduce:animate-none flex flex-col items-center gap-3 p-8 text-center"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-brand/15">
          <CheckIcon className="size-7 text-brand" />
        </span>
        <span className="text-lg font-bold text-primary">
          {done.mode === "claim" ? "Fees sent" : "Fees handed over"}
        </span>
        {done.mode === "claim" ? (
          <a
            href={`https://solscan.io/tx/${done.detail}`}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-1 font-mono text-xs text-secondary transition-colors hover:text-primary"
          >
            {shortAddress(done.detail, 8, 8)}
            <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
          </a>
        ) : (
          <p className="tnum max-w-[42ch] text-sm text-secondary">
            {done.detail} can claim this token now
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card sheen className="flex flex-col gap-5 p-5">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-wider text-secondary">
          CLAIMABLE NOW
        </span>
        <span className="tnum font-display text-3xl font-normal text-brand">
          {sol(lamports)}
        </span>
        <span className="flex items-center gap-2 text-xs text-secondary">
          {usdLabel && <span className="tnum">{usdLabel}</span>}
          <span className="flex items-center gap-1.5">
            <WhatsAppIcon className="size-3.5 text-brand" />
            <span className="tnum">{recipient}</span>
          </span>
        </span>
      </div>

      {!signedIn ? (
        <div className="flex flex-col gap-3 border-t border-primary/[0.06] pt-4">
          <p className="text-sm text-secondary">
            Sign in with the number this token was launched from to claim
          </p>
          <a
            href="/signin"
            className="group flex h-10 w-fit items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
          >
            Sign in
            <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      ) : !canClaim ? (
        <p className="border-t border-primary/[0.06] pt-4 text-sm text-secondary">
          These fees belong to another number. Whoever holds it can claim them
          or hand them on
        </p>
      ) : (
        <div className="flex flex-col gap-4 border-t border-primary/[0.06] pt-4">
          <Segmented<Mode>
            value={mode}
            onChange={(next) => {
              setMode(next);
              setError("");
            }}
            options={[
              { id: "claim", label: "Claim" },
              { id: "hand over", label: "Hand over" },
            ]}
          />

          {mode === "claim" ? (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold tracking-wider text-secondary">
                  SEND TO WALLET
                </span>
                <input
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder="Your Solana address"
                  className="h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 font-mono text-xs text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                />
              </label>

              {error && <p className="text-xs text-error">{error}</p>}

              <button
                type="button"
                disabled={!walletReady || lamports <= 0 || busy}
                onClick={claim}
                className={cn(
                  "flex h-10 w-fit items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                {busy ? "Sending" : `Claim ${sol(lamports)}`}
              </button>

              <span className="text-xs text-secondary">
                The transfer goes out of the launch wallet straight to this
                address. Network fees come out of the amount
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold tracking-wider text-secondary">
                  HAND THE FEES TO
                </span>
                <span className="relative flex h-10 items-center">
                  <WhatsAppIcon className="absolute left-3 size-4 text-brand" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="+1 415 555 01 42"
                    className="tnum h-10 w-full rounded-lg border border-primary/[0.06] bg-field pr-3 pl-9 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                  />
                </span>
              </label>

              {error && <p className="text-xs text-error">{error}</p>}

              <button
                type="button"
                disabled={!phoneReady || busy}
                onClick={handOver}
                className={cn(
                  "flex h-10 w-fit items-center rounded-full border px-5 text-sm font-bold text-primary transition-colors hover:bg-background/70",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                {busy ? "Handing over" : "Hand over the fees"}
              </button>

              <span className="text-xs text-secondary">
                Everything this token earns from now on belongs to that number,
                including what is unclaimed today. You cannot take it back
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
