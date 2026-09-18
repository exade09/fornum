import { Connection, PublicKey } from "@solana/web3.js";

/**
 * Reading an account off Solana. This is the shape every later read will take:
 * one connection, one address, one snapshot of what the cluster returned
 *
 * Nothing here is Fornum specific yet. Once the program ships, the same call
 * fetches a token account and the bytes get decoded instead of measured
 */

export const RPC_URL =
  process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com";

export type AccountSnapshot = {
  address: string;
  /** program that owns the account */
  owner: string;
  /** true when the account is itself a program */
  executable: boolean;
  lamports: number;
  /** size of the account data in bytes */
  dataLength: number;
  /** first bytes of the data, handy while there is nothing to decode yet */
  dataHead: string;
  /** slot the node answered from */
  slot: number;
  /** round trip in ms, measured client side */
  tookMs: number;
};

export function connect(rpcUrl: string = RPC_URL) {
  return new Connection(rpcUrl, "confirmed");
}

/** Reads one account and returns a flat snapshot of it */
export async function readAccount(
  address: string,
  connection: Connection = connect(),
): Promise<AccountSnapshot> {
  const pubkey = new PublicKey(address);
  const startedAt = Date.now();

  // context carries the slot the node answered from, which is what makes two
  // identical reads distinguishable
  const { context, value } = await connection.getAccountInfoAndContext(pubkey);
  const tookMs = Date.now() - startedAt;

  if (!value) {
    throw new Error(`Account ${address} does not exist on this cluster`);
  }

  return {
    address: pubkey.toBase58(),
    owner: value.owner.toBase58(),
    executable: value.executable,
    lamports: value.lamports,
    dataLength: value.data.length,
    dataHead: Buffer.from(value.data.subarray(0, 16)).toString("hex"),
    slot: context.slot,
    tookMs,
  };
}
