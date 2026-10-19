import { PublicKey } from "@solana/web3.js";
import { FUNDING_INDEX, addressAt, hasLaunchWallets } from "@/lib/solana/launch-wallets";
import { launchWalletAddress } from "@/lib/solana/wallet";
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

export const FLEET_SIZE = 60;

/** What the funding script tops a wallet up to */
export const FUNDED_TARGET = 15_000_000;

/**
 * What a launch costs with its 80/20 locked on chain, from a mainnet
 * simulation: 11 754 320 lamports for the mint, the curve accounts, the
 * sharing config and the fees, with a little room on top. A wallet holding
 * less than this cannot launch
 */
export const LAUNCH_COST = 12_000_000;

/**
 * How many coins the funding wallet may launch
 *
 * Every derived wallet launches exactly one. The funding wallet is allowed a
 * second, for testing, on the understanding that its two coins share pump.fun's
 * creator vaults and so their fees mix; see lib/tokens.ts for how they are split
 */
export const FUNDING_WALLET_LAUNCHES = 2;

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
  /** what the picker shows: the index, or the funding wallet's place after them */
  label: string;
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
  const indexes: number[] = [];
  for (let i = 0; i < count; i++) {
    const address = addressAt(i);
    if (!address) return null;
    addresses.push(address);
    indexes.push(i);
  }
  // the funding wallet goes last, as one more wallet a coin can launch from
  const funding = launchWalletAddress();
  if (funding && !addresses.includes(funding)) {
    addresses.push(funding);
    indexes.push(FUNDING_INDEX);
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

  return addresses.map((address, n) => {
    const index = indexes[n];
    // coins recorded on the old shared wallet carry no index but did use it
    const token = byIndex.get(index) ?? tokens.find((t) => t.launchWallet === address);
    const lamports = balances[n] ?? 0;
    const launchedHere = tokens.filter((t) => t.launchWallet === address).length;
    const spent =
      index === FUNDING_INDEX ? launchedHere >= FUNDING_WALLET_LAUNCHES : Boolean(token);

    let state: WalletState;
    if (spent) state = "used";
    else if (lamports >= LAUNCH_COST) state = "ready";
    else if (lamports > 0) state = "unrecorded";
    else state = "empty";

    return {
      index,
      label: index === FUNDING_INDEX ? String(count) : String(index),
      address,
      lamports,
      state,
      tokenId: token?.id ?? null,
      symbol: token?.symbol ?? null,
    };
  });
}
