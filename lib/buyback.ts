import "server-only";
import { randomUUID } from "node:crypto";
import { getToken, listTokens, recordBurn, recordBuyback, unburnedBuybacks } from "@/lib/db/store";
import { MIN_BUYBACK_LAMPORTS, burn, buyAndBurn, fornumTokenMint } from "@/lib/pump/buyback";
import { walletAt } from "@/lib/solana/launch-wallets";
import { forgetFees } from "@/lib/tokens";
import type { Token } from "@/lib/types";

/**
 * Fornum's 20% of other people's coins buys the Fornum token
 *
 * At a claim the owner's 80% leaves the launch wallet and Fornum's 20% stays
 * on it, counted as waiting. Right after the claim answers, the wallet spends
 * what is waiting on the Fornum token and burns it. Whatever does not go
 * through, a buy that failed or a share too small to be worth the fees, keeps
 * waiting and is picked up by the next claim or by the button on /admin.
 *
 * The Fornum token's own fees are not part of this: its share goes where any
 * share goes without a buyback, so the coin never buys itself
 */

/** Whether a claim on this token should leave Fornum's share for a buyback */
export function buysBack(token: Token) {
  const mint = fornumTokenMint();
  return Boolean(mint) && token.mint !== mint && token.walletIndex !== null && token.walletIndex !== undefined;
}

// one buy per wallet at a time, so two runs cannot spend the same SOL
const busy = new Set<string>();

export type BuybackRun =
  | { tokenId: string; ok: true; spentLamports: number; burned: string; buyTx: string; burnTx: string | null; note?: string }
  | { tokenId: string; ok: false; error: string };

/** Spends what is waiting on one token's wallet, when there is enough of it */
export async function runBuyback(tokenId: string): Promise<BuybackRun | null> {
  const mint = fornumTokenMint();
  const token = await getToken(tokenId);
  if (!mint || !token || !buysBack(token)) return null;

  const waiting = token.buybackPendingLamports ?? 0;
  if (waiting < MIN_BUYBACK_LAMPORTS) return null;

  const signer = walletAt(token.walletIndex!);
  if (!signer || signer.publicKey.toBase58() !== token.launchWallet) {
    return { tokenId, ok: false, error: "The launch wallet key is not available" };
  }
  if (busy.has(token.launchWallet)) return { tokenId, ok: false, error: "A buy is already running on this wallet" };

  busy.add(token.launchWallet);
  try {
    const r = await buyAndBurn(signer, mint, waiting);
    await recordBuyback({
      id: randomUUID(),
      tokenId,
      spentLamports: r.spentLamports,
      tokensBought: r.bought.toString(),
      tokensBurned: r.burned.toString(),
      decimals: r.decimals,
      buyTx: r.buyTx,
      burnTx: r.burnTx,
    });
    forgetFees(tokenId);
    if (r.burnError) console.error(`[buyback] ${tokenId} bought but did not burn`, r.burnError);
    return {
      tokenId,
      ok: true,
      spentLamports: r.spentLamports,
      burned: r.burned.toString(),
      buyTx: r.buyTx,
      burnTx: r.burnTx,
      note: r.burnError,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[buyback] ${tokenId} failed`, error);
    return { tokenId, ok: false, error };
  } finally {
    busy.delete(token.launchWallet);
  }
}

/**
 * Everything that is waiting, for the button on /admin
 *
 * Burns that failed earlier go first, then buys, one wallet after another,
 * stopping before the request runs out of time
 */
export async function runPendingBuybacks(budgetMs = 45_000) {
  const started = Date.now();
  const mint = fornumTokenMint();
  const results: BuybackRun[] = [];
  if (!mint) return results;

  for (const b of await unburnedBuybacks()) {
    if (Date.now() - started > budgetMs) break;
    const token = await getToken(b.tokenId);
    const signer = token?.walletIndex != null ? walletAt(token.walletIndex) : null;
    if (!token || !signer || BigInt(b.tokensBought) === BigInt(0)) continue;
    try {
      const done = await burn(signer, mint, BigInt(b.tokensBought));
      await recordBurn(b.id, {
        tokensBurned: done.burned.toString(),
        burnTx: done.signature,
        extraSpentLamports: done.spentLamports,
      });
      forgetFees(token.id);
      results.push({ tokenId: token.id, ok: true, spentLamports: done.spentLamports, burned: done.burned.toString(), buyTx: b.buyTx, burnTx: done.signature });
    } catch (err) {
      results.push({ tokenId: token.id, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const waiting = (await listTokens()).filter(
    (t) => buysBack(t) && (t.buybackPendingLamports ?? 0) >= MIN_BUYBACK_LAMPORTS,
  );
  for (const t of waiting) {
    if (Date.now() - started > budgetMs) break;
    const r = await runBuyback(t.id);
    if (r) results.push(r);
  }
  return results;
}
