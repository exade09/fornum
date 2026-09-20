import { randomUUID } from "node:crypto";
import { readSession } from "@/lib/auth/session";
import { getToken, recordClaim } from "@/lib/db/store";
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
import {
  claimableFromBalance,
  claimableLamports,
  feeRecipientHash,
} from "@/lib/types";

/**
 * Take the creator fees of one token
 *
 * Order matters: prove who is asking, work out what they are owed, send the
 * transfer, and only then write the claim. A failed transfer leaves nothing
 * behind, and the write moves the claimed total in the same transaction so the
 * same fees cannot go out twice
 */
export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }

  const { tokenId, wallet } = (await request.json()) as {
    tokenId?: string;
    wallet?: string;
  };

  if (!tokenId || !wallet || !isValidAddress(wallet)) {
    return Response.json(
      { error: "Send a token and a valid Solana address" },
      { status: 400 },
    );
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
   * exemption, so a claim cannot leave the wallet to be swept away
   */
  const owed = perToken
    ? claimableFromBalance(
        balance,
        Math.max(token.baselineLamports, RENT_EXEMPT_LAMPORTS),
        FEE_LAMPORTS,
      )
    : Math.min(claimableLamports(token), sendableFrom(balance));

  if (owed <= 0) {
    return Response.json({ error: "Nothing to claim" }, { status: 400 });
  }

  const sent = await payOut(wallet.trim(), owed, {
    signer,
    floor: perToken
      ? Math.max(token.baselineLamports, RENT_EXEMPT_LAMPORTS)
      : undefined,
  });
  if (!sent.ok) {
    return Response.json({ error: sent.error }, { status: 502 });
  }

  const claim = await recordClaim({
    id: randomUUID(),
    tokenId: token.id,
    amountLamports: owed,
    wallet: wallet.trim(),
    tx: sent.signature,
  });

  return Response.json({
    amountLamports: claim.amountLamports,
    tx: claim.tx,
  });
}
