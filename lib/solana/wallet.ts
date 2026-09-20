import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { connect } from "@/lib/solana/read";
import "server-only";

/**
 * The wallet that deploys mints and therefore collects their creator fees
 *
 * The secret never leaves the server. A claim is a plain SOL transfer out of
 * this wallet to an address the recipient gave us, which is why the code here
 * is short: there is no program to call yet
 */

export const LAMPORTS = LAMPORTS_PER_SOL;

/** Left behind so the account stays rent exempt and can keep paying fees */
export const RESERVE_LAMPORTS = 2_000_000;

/** Headroom for the transfer fee itself */
export const FEE_LAMPORTS = 10_000;

/** Rent exemption for a plain account, the least a wallet can hold and survive */
export const RENT_EXEMPT_LAMPORTS = 890_880;

/**
 * The most that can leave the wallet right now
 *
 * A claim asks for what a token earned, but the wallet also has to survive the
 * transaction and stay rent exempt, so the amount is capped here rather than
 * failing at send time with an unhelpful error
 */
export function sendableFrom(balance: number) {
  return Math.max(balance - RESERVE_LAMPORTS - FEE_LAMPORTS, 0);
}

export function launchKeypair(): Keypair | null {
  const secret = process.env.LAUNCH_WALLET_SECRET;
  if (!secret) return null;

  try {
    // accepts a base58 secret key, which is what wallets export
    const bytes = bs58.decode(secret.trim());
    return Keypair.fromSecretKey(bytes);
  } catch {
    try {
      // or the JSON byte array solana-keygen writes
      const arr = JSON.parse(secret) as number[];
      return Keypair.fromSecretKey(Uint8Array.from(arr));
    } catch {
      return null;
    }
  }
}

export function launchWalletAddress(): string | null {
  return launchKeypair()?.publicKey.toBase58() ?? null;
}

export function isValidAddress(address: string) {
  try {
    // a valid base58 key is not enough, it also has to be on the curve or a
    // known program address, and PublicKey rejects the rest
    new PublicKey(address.trim());
    return true;
  } catch {
    return false;
  }
}

/** Live balance of any account, in lamports */
export async function balanceOf(address: string) {
  const connection = connect();
  return connection.getBalance(new PublicKey(address));
}

export type TransferResult =
  { ok: true; signature: string } | { ok: false; error: string };

/**
 * Sends lamports from the launch wallet to a destination
 *
 * Refuses to spend below the reserve, so a claim can never leave the wallet
 * unable to pay for the next transaction
 */
export async function payOut(
  to: string,
  lamports: number,
  options: { signer?: Keypair | null; floor?: number } = {},
): Promise<TransferResult> {
  // a per token launch wallet signs for its own token, and keeps a smaller
  // floor than the shared wallet because it only has to survive, not to fund
  // the next launch
  const keypair = options.signer ?? launchKeypair();
  const floor = options.floor ?? RESERVE_LAMPORTS;

  if (!keypair) {
    return {
      ok: false,
      error: "Payouts are not configured on this deployment",
    };
  }
  if (!isValidAddress(to)) {
    return { ok: false, error: "That is not a Solana address" };
  }
  if (!Number.isFinite(lamports) || lamports <= 0) {
    return { ok: false, error: "Nothing to send" };
  }

  const connection = connect();
  const available = await connection.getBalance(keypair.publicKey);

  if (available - lamports < floor) {
    return { ok: false, error: "The launch wallet is short on balance" };
  }

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keypair.publicKey,
      toPubkey: new PublicKey(to.trim()),
      lamports,
    }),
  );

  try {
    const signature = await sendAndConfirmTransaction(
      connection,
      tx,
      [keypair],
      {
        commitment: "confirmed",
      },
    );
    return { ok: true, signature };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "The transfer failed",
    };
  }
}
