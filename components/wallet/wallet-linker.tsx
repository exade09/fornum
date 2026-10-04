"use client";

import { useEffect, useState } from "react";
import { WALLETS } from "@/components/icons/wallets";
import { connectWallet, installed, type WalletId } from "@/lib/wallet/injected";
import { shortAddress } from "@/lib/format";
import { cn } from "@/lib/cn";

const BROWSER_WALLETS = WALLETS.filter((w): w is (typeof WALLETS)[number] & { id: WalletId } =>
  ["phantom", "solflare", "backpack"].includes(w.id),
);

/**
 * Points the signed in number's fees at a wallet
 *
 * Connect one that is installed, or paste an address. Either way only the
 * public key is used, nothing is signed
 */
export function WalletLinker({
  current,
  onLinked,
}: {
  current: string | null;
  onLinked: (wallet: string) => void;
}) {
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [pasted, setPasted] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // providers are injected after load, so look once mounted
  useEffect(() => {
    setPresent(
      Object.fromEntries(BROWSER_WALLETS.map((w) => [w.id, installed(w.id)])),
    );
  }, []);

  async function link(address: string) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/account/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: address }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not link that wallet");
      return;
    }
    setPasted("");
    onLinked(address);
  }

  async function fromWallet(id: WalletId) {
    if (busy) return;
    const address = await connectWallet(id);
    if (!address) {
      setError("The wallet did not share an address");
      return;
    }
    await link(address);
  }

  return (
    <div className="flex flex-col gap-4">
      {current && (
        <div className="flex items-center justify-between rounded-xl border border-primary/[0.06] bg-background/70 px-4 py-3">
          <span className="text-xs text-secondary">Fees go to</span>
          <span className="font-mono text-xs text-primary">
            {shortAddress(current, 6, 6)}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {BROWSER_WALLETS.map((w) => {
          const Mark = w.Mark;
          const here = present[w.id];
          return (
            <button
              key={w.id}
              type="button"
              disabled={!here || busy}
              onClick={() => fromWallet(w.id)}
              className="flex items-center gap-3 rounded-xl border border-primary/[0.06] bg-background/70 px-3 py-3 text-left transition-colors hover:border-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mark className="size-8 shrink-0 rounded-lg" />
              <span className="text-sm font-bold text-primary">{w.name}</span>
              <span className="ml-auto text-xs text-secondary">
                {here ? "Connect" : "Not installed"}
              </span>
            </button>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (pasted.trim().length >= 32 && !busy) link(pasted.trim());
        }}
        className="flex flex-col gap-2"
      >
        <span className="text-[10px] font-bold tracking-wider text-secondary">
          OR PASTE AN ADDRESS
        </span>
        <div className="flex gap-2">
          <input
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Your Solana address"
            className="h-10 min-w-0 flex-1 rounded-lg border border-primary/[0.06] bg-field px-3 font-mono text-xs text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          />
          <button
            type="submit"
            disabled={pasted.trim().length < 32 || busy}
            className={cn(
              "flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {busy ? "Linking" : "Link"}
          </button>
        </div>
      </form>

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
