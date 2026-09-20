/**
 * The shapes the app works in. Amounts are lamports throughout, because that
 * is what the chain deals in and what a claim actually moves. Dollars are a
 * display concern and are derived at render time from a live SOL price
 */

export type TokenStatus = "live" | "graduated" | "pending";

export type Token = {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  status: TokenStatus;

  /** salted hash of the number that asked for the launch */
  ownerHash: string;
  /** masked copy, safe to show */
  ownerMasked: string;

  /** set when the owner hands the fees to somebody else */
  assigneeHash?: string | null;
  assigneeMasked?: string | null;

  /** wallet that deployed the mint and collects the creator fees */
  launchWallet: string;
  /**
   * Which wallet of the launch phrase that is
   *
   * Null for launches made before wallets were per token, which still run off
   * the single LAUNCH_WALLET_SECRET
   */
  walletIndex?: number | null;
  /**
   * What the launch wallet held once the launch was paid for
   *
   * The wallet is funded before it can deploy anything, so its balance is not
   * all fees. Everything above this line is
   */
  baselineLamports: number;

  feesAccruedLamports: number;
  feesClaimedLamports: number;

  marketCapUsd: number;
  holders: number;
  createdAt: string;
};

export type Claim = {
  id: string;
  tokenId: string;
  amountLamports: number;
  wallet: string;
  tx: string;
  createdAt: string;
};

export type LaunchRequest = {
  id: string;
  phoneHash: string;
  phoneMasked: string;
  note: string | null;
  status: "new" | "launched" | "rejected";
  tokenId: string | null;
  createdAt: string;
};

export const LAMPORTS_PER_SOL = 1_000_000_000;

/** What is left to take right now, from what was recorded for the token */
export function claimableLamports(t: Token) {
  return Math.max(t.feesAccruedLamports - t.feesClaimedLamports, 0);
}

/**
 * The same figure worked out from the wallet itself
 *
 * A claim moves SOL out of the launch wallet, so the balance falls by exactly
 * what was taken and nothing has to be subtracted for past claims. Whatever
 * sits above the funding baseline, minus what the wallet needs to keep to pay
 * for its own transaction, is what the recipient can have
 */
export function claimableFromBalance(
  balanceLamports: number,
  baselineLamports: number,
  reserveLamports: number,
) {
  return Math.max(balanceLamports - baselineLamports - reserveLamports, 0);
}

/** Whoever the fees were handed to, otherwise the owner */
export function feeRecipientHash(t: Token) {
  return t.assigneeHash ?? t.ownerHash;
}

export function feeRecipientMasked(t: Token) {
  return t.assigneeMasked ?? t.ownerMasked;
}
