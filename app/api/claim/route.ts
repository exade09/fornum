import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { readSession } from "@/lib/auth/session";
import {
  acquireClaimLock,
  getToken,
  getWallet,
  recordClaim,
  releaseClaimLock,
  setFeeSharing,
} from "@/lib/db/store";
import type { Keypair } from "@solana/web3.js";
import {
  FEE_LAMPORTS,
  RENT_EXEMPT_LAMPORTS,
  balanceOf,
  isValidAddress,
  launchKeypair,
  payOut,
  sendableFrom,
} from "@/lib/solana/wallet";
import { walletAt } from "@/lib/solana/launch-wallets";
import { MIN_COLLECT_LAMPORTS, collectCreatorFees, readWalletFees } from "@/lib/pump/fees";
import { forgetFees } from "@/lib/tokens";
import { buybackConfig, platformMint, treasuryWallet } from "@/lib/buyback/config";
import { distributeNative } from "@/lib/pump/distribute";
import { recheckLaunch } from "@/lib/pump/native-launch";
import { recordPendingCredit } from "@/lib/buyback/ledger";
import { runBuybackPass } from "@/lib/buyback/worker";
import { hasDatabase } from "@/lib/db/client";
import {
  claimableFromBalance,
  claimableLamports,
  feeRecipientHash,
  ownerShare,
  type Token,
} from "@/lib/types";

/**
 * Take the creator fees of one token
 *
 * Order matters: prove who is asking, work out what they are owed, send the
 * transfer, and only then write the claim. A failed transfer leaves nothing
 * behind, and the write moves the claimed total in the same transaction so the
 * same fees cannot go out twice
 */
// collecting from pump.fun first means two transactions back to back, and a
// buyback pass runs after the answer within the same limit
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }

  const body = (await request.json()) as {
    tokenId?: string;
    wallet?: string;
  };
  const tokenId = body.tokenId;
  // an address typed for this claim wins, otherwise the one linked to the number
  const wallet = body.wallet?.trim() || (await getWallet(session.sub));

  if (!tokenId || !wallet || !isValidAddress(wallet)) {
    return Response.json(
      { error: "Send a token and a valid Solana address" },
      { status: 400 },
    );
  }

  const treasury = treasuryWallet();
  if (treasury && wallet.trim() === treasury) {
    return Response.json({ error: "That address is Fornum's treasury, use your own" }, { status: 400 });
  }

  const token = await getToken(tokenId);
  if (!token) {
    return Response.json({ error: "No such token" }, { status: 404 });
  }

  if (feeRecipientHash(token) !== session.sub) {
    return Response.json(
      { error: "These fees belong to another number" },
      { status: 403 },
    );
  }

  /**
   * Which key signs for this token
   *
   * A token launched from its own wallet is paid out of that wallet. Older
   * rows carry no index and still run off the single shared wallet
   */
  const perToken = token.walletIndex !== null && token.walletIndex !== undefined;
  const signer = perToken ? walletAt(token.walletIndex!) : launchKeypair();

  if (!signer) {
    return Response.json(
      { error: "Payouts are not configured on this deployment" },
      { status: 503 },
    );
  }

  // the key must actually be the wallet the token's fees went to, or a wrong
  // index would quietly pay out of somebody else's token
  if (signer.publicKey.toBase58() !== token.launchWallet) {
    console.error(
      `[claim] ${token.id} expects ${token.launchWallet}, derived ${signer.publicKey.toBase58()}`,
    );
    return Response.json(
      { error: "This token's wallet does not match its records" },
      { status: 500 },
    );
  }

  // one claim per coin at a time, so two clicks cannot pay the same fees twice
  const lockOwner = randomUUID();
  if (!(await acquireClaimLock(token.id, lockOwner))) {
    return Response.json(
      { error: "A claim for this token is already running, try again in a minute" },
      { status: 409 },
    );
  }
  try {
    return await settle(token, signer, perToken, wallet.trim(), treasury);
  } finally {
    await releaseClaimLock(token.id, lockOwner).catch(() => {});
  }
}

async function settle(
  token: Token,
  signer: Keypair,
  perToken: boolean,
  wallet: string,
  treasury: string | null,
) {
  const native = Boolean(token.feeSharing);

  /**
   * A coin with its split locked on chain is paid only once that split is
   * verified on the finalized chain
   */
  if (native && token.feeSharing !== "native") {
    const check = await recheckLaunch(token.mint).catch((err) => ({
      verified: false,
      problems: [err instanceof Error ? err.message : String(err)],
    }));
    if (!check.verified) {
      return Response.json(
        { error: `This token's fee split is not verified on chain yet: ${check.problems.join("; ")}` },
        { status: 409 },
      );
    }
    await setFeeSharing(token.id, "native");
  }

  /**
   * Bring the fees in from pump.fun first
   *
   * A native coin's fees are distributed by pump.fun itself: 80% lands on the
   * launch wallet, 20% on the treasury, and the treasury pays the network fee
   * when its key is here. An older coin's fees are collected into the launch
   * wallet whole. Either way, if this step fails, whatever is already in the
   * wallet can still be paid
   */
  if (native) {
    try {
      const payer = buybackConfig().treasuryKey ?? signer;
      await distributeNative(token.mint, payer);
    } catch (err) {
      console.error(`[claim] ${token.id} could not distribute on pump.fun`, err);
    }
  } else if (perToken) {
    try {
      const waiting = (
        await readWalletFees([{ wallet: token.launchWallet, mint: token.mint }])
      ).get(token.mint);
      if (waiting && waiting.uncollectedLamports >= MIN_COLLECT_LAMPORTS) {
        await collectCreatorFees(signer, token.mint);
      }
    } catch (err) {
      console.error(`[claim] ${token.id} could not collect from pump.fun`, err);
    }
  }

  let balance: number;
  try {
    balance = await balanceOf(token.launchWallet);
  } catch {
    return Response.json(
      { error: "Could not read the wallet right now, try again" },
      { status: 502 },
    );
  }

  /**
   * How much is owed
   *
   * With a wallet of its own, the token's fees are simply what sits above the
   * line the wallet was funded to, so the chain is the source of truth and
   * nobody has to record an amount. The floor never drops below rent
   * exemption, so a claim cannot leave the wallet to be swept away.
   *
   * A native coin's wallet only ever receives the owner's 80%, so all of it
   * goes to the owner: the 20% already reached the treasury on chain, and the
   * treasury ledger reads it from the distribution itself.
   *
   * An older coin's amount is split 80/20 here: the owner's part goes to
   * their address, Fornum's goes to the treasury in the same transaction, or
   * stays on the launch wallet above a raised line when no treasury is set.
   * What reaches the treasury is written to the buyback ledger once the
   * receipt is final, except for the Fornum token's own fees
   */
  const floor = Math.max(token.baselineLamports, RENT_EXEMPT_LAMPORTS);
  const distributable = perToken
    ? claimableFromBalance(balance, floor, FEE_LAMPORTS)
    : 0;
  const owed = native
    ? distributable
    : perToken
      ? ownerShare(distributable)
      : Math.min(claimableLamports(token), sendableFrom(balance));
  const fornum = perToken && !native ? distributable - owed : 0;

  if (owed <= 0) {
    return Response.json({ error: "Nothing to claim" }, { status: 400 });
  }

  const sent = await payOut(wallet, owed, {
    signer,
    floor: perToken ? floor : undefined,
    also: fornum > 0 && treasury ? [{ to: treasury, lamports: fornum }] : [],
  });
  if (!sent.ok) {
    return Response.json({ error: sent.error }, { status: 502 });
  }

  forgetFees(token.id);
  const claim = await recordClaim(
    {
      id: randomUUID(),
      tokenId: token.id,
      amountLamports: owed,
      wallet,
      tx: sent.signature,
    },
    {
      fornumLamports: fornum,
      // kept on the launch wallet when there is no treasury, so lift its line
      baselineBumpLamports: fornum > 0 && !treasury ? fornum : 0,
    },
  );

  if (hasDatabase && token.mint !== platformMint()) {
    try {
      if (fornum > 0 && treasury) {
        await recordPendingCredit({
          tokenId: token.id,
          mint: token.mint,
          signature: sent.signature,
          treasury,
          mainMint: platformMint(),
          expectedLamports: fornum,
        });
      }
      // confirms credits (and reads native distributions) once they are
      // final, and buys back when the ledger allows
      if ((fornum > 0 && treasury) || native) {
        after(async () => {
          await runBuybackPass(45_000);
        });
      }
    } catch (err) {
      // the payout is done and recorded; the credit can be added by hand from the signature
      console.error(`[claim] ${token.id} could not record the treasury credit ${sent.signature}`, err);
    }
  }

  return Response.json({
    amountLamports: claim.amountLamports,
    tx: claim.tx,
  });
}
