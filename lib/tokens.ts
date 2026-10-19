import "server-only";
import { getToken, listTokens, setAccrued } from "@/lib/db/store";
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
 * The figure is written back to the row, so totals and lists stay right even
 * when the chain is slow, and it is cached briefly so a busy page does not
 * read the chain on every view. Tokens on the old shared wallet keep the
 * amount recorded for them
 */

const FRESH_MS = 30_000;
const cache = new Map<string, { at: number; accrued: number }>();

function onOwnWallet(t: Token) {
  return t.walletIndex !== null && t.walletIndex !== undefined;
}

export async function withLiveFees(tokens: Token[]): Promise<Token[]> {
  const now = Date.now();
  const stale = tokens.filter((t) => {
    if (!onOwnWallet(t)) return false;
    const hit = cache.get(t.id);
    return !hit || now - hit.at > FRESH_MS;
  });

  if (stale.length > 0) {
    try {
      const fees = await readWalletFees(stale.map((t) => ({ wallet: t.launchWallet, mint: t.mint })));
      for (const t of stale) {
        const f = fees.get(t.launchWallet);
        if (!f) continue;
        const collected = Math.max(f.walletLamports - t.baselineLamports, 0);
        const accrued = Math.max(f.uncollectedLamports + collected + t.feesClaimedLamports, t.feesClaimedLamports);
        cache.set(t.id, { at: now, accrued });
        if (Math.abs(accrued - t.feesAccruedLamports) >= 1_000) {
          setAccrued(t.id, accrued).catch((err) =>
            console.error("[fees] could not store", t.id, err),
          );
        }
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

export async function liveToken(id: string) {
  const t = await getToken(id);
  return t ? (await withLiveFees([t]))[0] : null;
}

/** Forget a cached figure, after a claim has moved money */
export function forgetFees(id: string) {
  cache.delete(id);
}
