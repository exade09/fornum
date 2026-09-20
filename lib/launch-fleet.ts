import { PublicKey } from "@solana/web3.js";
import { addressAt, hasLaunchWallets } from "@/lib/solana/launch-wallets";
import { connect } from "@/lib/solana/read";
import { listTokens } from "@/lib/db/store";
import "server-only";

/**
 * The state of every launch wallet, in one view
 *
 * The operator used to keep this in a spreadsheet and type an index into a
 * form, which is the one place a mistake costs a customer their fees. Here the
 * wallets are derived, their balances read in a single call, and each one is
 * matched against what has actually been launched
 */

export const FLEET_SIZE = 100;

/** What the funding script tops a wallet up to */
export const FUNDED_TARGET = 15_000_000;

/**
 * What a launch costs, measured on a real mainnet launch: metadata account,
 * mint, curve accounts and fees. A wallet holding less than this cannot launch
 */
export const LAUNCH_COST = 11_690_000;

export type WalletState =
  /** funded, never used, safe to launch from */
  | "ready"
  /** a token was recorded against it */
  | "used"
  /** never funded */
  | "empty"
  /** money left it but nothing was recorded, so somebody launched and forgot */
  | "unrecorded";

export type LaunchWallet = {
  index: number;
  address: string;
  lamports: number;
  state: WalletState;
  tokenId: string | null;
  symbol: string | null;
};

/** Null when no phrase is configured, which is a setup problem, not an empty fleet */
export async function launchFleet(
  count = FLEET_SIZE,
): Promise<LaunchWallet[] | null> {
  if (!hasLaunchWallets()) return null;

  const addresses: string[] = [];
  for (let i = 0; i < count; i++) {
    const address = addressAt(i);
    if (!address) return null;
    addresses.push(address);
  }

  const tokens = await listTokens();
  const byIndex = new Map(
    tokens
      .filter((t) => t.walletIndex !== null && t.walletIndex !== undefined)
      .map((t) => [t.walletIndex as number, t]),
  );

  // balances in one round trip per hundred, rather than a hundred round trips
  const balances: number[] = [];
  const connection = connect();
  for (let i = 0; i < addresses.length; i += 100) {
    const slice = addresses.slice(i, i + 100).map((a) => new PublicKey(a));
    try {
      const infos = await connection.getMultipleAccountsInfo(slice);
      balances.push(...infos.map((info) => info?.lamports ?? 0));
    } catch {
      // a wallet whose balance is unknown is shown as empty rather than
      // wrongly offered as ready
      balances.push(...slice.map(() => 0));
    }
  }

  return addresses.map((address, index) => {
    const token = byIndex.get(index);
    const lamports = balances[index] ?? 0;

    let state: WalletState;
    if (token) state = "used";
    else if (lamports >= LAUNCH_COST) state = "ready";
    else if (lamports > 0) state = "unrecorded";
    else state = "empty";

    return {
      index,
      address,
      lamports,
      state,
      tokenId: token?.id ?? null,
      symbol: token?.symbol ?? null,
    };
  });
}
