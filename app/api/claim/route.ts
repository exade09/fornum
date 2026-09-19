import { randomUUID } from "node:crypto";
import { readSession } from "@/lib/auth/session";
import { getToken, recordClaim } from "@/lib/db/store";
import {
  balanceOf,
  isValidAddress,
  payOut,
  sendableFrom,
} from "@/lib/solana/wallet";
import { claimableLamports, feeRecipientHash } from "@/lib/types";

/**
 * Take the creator fees of one token
 *
 * Order matters: prove who is asking, work out what they are owed from stored
 * state, send the transfer, and only then write the claim. A failed transfer
 * leaves nothing behind, and the write moves the claimed total in the same
 * transaction so the same fees cannot go out twice
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

  // what this token is owed, from what we recorded for it
  const owed = claimableLamports(token);
  if (owed <= 0) {
    return Response.json({ error: "Nothing to claim" }, { status: 400 });
  }

  // one wallet holds the fees of every token, so the owed amount is also capped
  // by what the wallet can actually part with
  let sendable = owed;
  try {
    const balance = await balanceOf(token.launchWallet);
    sendable = Math.min(owed, sendableFrom(balance));
  } catch {
    // reading the chain failed, let payOut do its own balance check
  }

  if (sendable <= 0) {
    return Response.json(
      { error: "The launch wallet has not been topped up for this yet" },
      { status: 409 },
    );
  }

  const amount = sendable;

  const sent = await payOut(wallet.trim(), amount);
  if (!sent.ok) {
    return Response.json({ error: sent.error }, { status: 502 });
  }

  const claim = await recordClaim({
    id: randomUUID(),
    tokenId: token.id,
    amountLamports: amount,
    wallet: wallet.trim(),
    tx: sent.signature,
  });

  return Response.json({
    amountLamports: claim.amountLamports,
    tx: claim.tx,
  });
}
