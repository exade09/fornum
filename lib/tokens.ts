import "server-only";
import { listTokens, setAccrued } from "@/lib/db/store";
import { readWalletFees } from "@/lib/pump/fees";
import type { Token } from "@/lib/types";

/**
 * Tokens with their fees read off the chain
 *
 * Nobody types fees in. For a token with its own launch wallet everything it
 * ever earned is either still with pump.fun, already collected into the
 * wallet above the line it was funded to, or already claimed:
 *
 *   earned = uncollected at pump.fun + (wallet balance - baseline) + claimed
 *
 * pump.fun keeps part of that per coin (waiting on the coin's own curve and
 * pool) and part per creator (the creator vaults). A wallet normally makes one
 * coin, so the split does not matter. When one wallet made more than one, as
 * the funding wallet may, the per creator part and what was collected into the
 * wallet go to the oldest coin on it and the others count only their own part,
 * so nothing is counted twice.
 *
 * The figure is written back to the row, so totals and lists stay right even
 * when the chain is slow, and it is cached briefly so a busy page does not
 * read the chain on every view. Tokens on the old shared wallet without an
 * index keep the amount recorded for them
 */

const FRESH_MS = 30_000;
const cache = new Map<string, { at: number; accrued: number }>();

function onOwnWallet(t: Token) {
  return t.walletIndex !== null && t.walletIndex !== undefined;
}

export async function withLiveFees(tokens: Token[]): Promise<Token[]> {
  const now = Date.now();
  const tracked = tokens.filter(onOwnWallet);

  // wallets with any token whose figure is stale get read again, all coins on them together
  const staleWallets = new Set(
    tracked
      .filter((t) => {
        const hit = cache.get(t.id);
        return !hit || now - hit.at > FRESH_MS;
      })
      .map((t) => t.launchWallet),
  );
  const toRead = tracked.filter((t) => staleWallets.has(t.launchWallet));

  if (toRead.length > 0) {
    try {
      const fees = await readWalletFees(toRead.map((t) => ({ wallet: t.launchWallet, mint: t.mint })));

      const byWallet = new Map<string, Token[]>();
      for (const t of toRead) byWallet.set(t.launchWallet, [...(byWallet.get(t.launchWallet) ?? []), t]);

      for (const group of byWallet.values()) {
        group.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        group.forEach((t, i) => {
          const f = fees.get(t.mint);
          if (!f) return;
          const first = i === 0;
          const collected = first ? Math.max(f.walletLamports - t.baselineLamports, 0) : 0;
          const uncollected = f.ownLamports + (first ? f.sharedLamports : 0);
          const accrued = Math.max(uncollected + collected + t.feesClaimedLamports, t.feesClaimedLamports);
          cache.set(t.id, { at: now, accrued });
          if (Math.abs(accrued - t.feesAccruedLamports) >= 1_000) {
            setAccrued(t.id, accrued).catch((err) => console.error("[fees] could not store", t.id, err));
          }
        });
      }
    } catch (err) {
      // the chain being slow is no reason to break a page, stored figures stand
      console.error("[fees] chain read failed", err);
    }
  }

  return tokens.map((t) => {
    const hit = onOwnWallet(t) ? cache.get(t.id) : undefined;
    return hit ? { ...t, feesAccruedLamports: hit.accrued } : t;
  });
}

export async function liveTokens() {
  return withLiveFees(await listTokens());
}

/** One token, read with the others so coins sharing a wallet are split right */
export async function liveToken(id: string) {
  return (await liveTokens()).find((t) => t.id === id) ?? null;
}

/** Forget a cached figure, after a claim has moved money */
export function forgetFees(id: string) {
  cache.delete(id);
}
