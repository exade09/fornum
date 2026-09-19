"use client";

import { useState } from "react";
import { Card } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { ConnectWallet } from "@/components/wallet/connect-wallet";
import { ArrowRightIcon, CheckIcon, WhatsAppIcon } from "@/components/icons";
import { usd } from "@/lib/data";
import { cn } from "@/lib/cn";

type Mode = "claim" | "hand over";

/**
 * Everything the fee recipient can do with a token, in one panel: take the
 * money, or point it at somebody else's number
 *
 * Both actions are gated on being signed in as the recipient, so the panel
 * renders read only for everyone else
 */
export function ClaimPanel({
  amount,
  recipient,
  canClaim,
  signedIn,
}: {
  /** claimable right now, USD */
  amount: number;
  /** masked number the fees belong to */
  recipient: string;
  /** the signed in number matches the recipient */
  canClaim: boolean;
  signedIn: boolean;
}) {
  const [mode, setMode] = useState<Mode>("claim");
  const [wallet, setWallet] = useState("");
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState<null | Mode>(null);

  const walletReady = wallet.trim().length >= 32;
  const phoneReady = phone.replace(/\D/g, "").length >= 8;

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
          {done === "claim" ? "Claim submitted" : "Fees handed over"}
        </span>
        <p className="max-w-[42ch] text-sm text-secondary">
          {done === "claim"
            ? "The transfer shows up on this page and in Claims once it is on chain"
            : `${phone} can now claim the fees of this token by signing in with that number`}
        </p>
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
          {usd(amount, 2)}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-secondary">
          <WhatsAppIcon className="size-3.5 text-brand" />
          <span className="tnum">{recipient}</span>
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
            onChange={setMode}
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

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!walletReady || amount <= 0}
                  onClick={() => setDone("claim")}
                  className={cn(
                    "flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  )}
                >
                  Claim {usd(amount, 0)}
                </button>
                <ConnectWallet className="flex h-10" />
              </div>

              <span className="text-xs text-secondary">
                Paste an address or connect a wallet to fill it in. Network fees
                come out of the amount
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

              <button
                type="button"
                disabled={!phoneReady}
                onClick={() => setDone("hand over")}
                className={cn(
                  "flex h-10 w-fit items-center rounded-full border px-5 text-sm font-bold text-primary transition-colors hover:bg-background/70",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                Hand over the fees
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
