import "server-only";
import { RPC_URL } from "@/lib/solana/read";

/**
 * A transaction receipt, whatever version the transaction was sent in
 *
 * web3.js 1.x only asks for versions up to 0, and the RPC refuses to return a
 * newer transaction to such a request. Wallets and frontends already send
 * version 1, and a distribution anyone else sends may be one, so receipts are
 * read here straight from the RPC, parsed, with every version allowed. Loaded
 * lookup-table addresses are part of `accountKeys`, as the RPC returns them
 */

export type ReceiptIx = {
  programId: string;
  program?: string;
  parsed?: { type?: string; info?: Record<string, unknown> } & Record<string, unknown>;
  accounts?: string[];
  data?: string;
};

export type Receipt = {
  version: number | "legacy";
  err: unknown;
  fee: number;
  accountKeys: string[];
  preBalances: number[];
  postBalances: number[];
  preTokenBalances: { accountIndex: number; mint: string; owner?: string; uiTokenAmount: { amount: string; decimals: number } }[];
  postTokenBalances: { accountIndex: number; mint: string; owner?: string; uiTokenAmount: { amount: string; decimals: number } }[];
  instructions: ReceiptIx[];
  inner: ReceiptIx[];
};

const MAX_VERSION = 1;

export async function fetchReceipt(
  signature: string,
  commitment: "confirmed" | "finalized" = "finalized",
): Promise<Receipt | null> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: MAX_VERSION, commitment }],
    }),
  });
  if (!res.ok) throw new Error(`RPC answered ${res.status}`);
  const body = (await res.json()) as { result?: Record<string, any> | null; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message ?? "RPC error");
  const tx = body.result;
  if (!tx?.meta) return null;
  const msg = tx.transaction.message;
  return {
    version: tx.version ?? "legacy",
    err: tx.meta.err,
    fee: tx.meta.fee,
    accountKeys: msg.accountKeys.map((k: { pubkey: string } | string) => (typeof k === "string" ? k : k.pubkey)),
    preBalances: tx.meta.preBalances,
    postBalances: tx.meta.postBalances,
    preTokenBalances: tx.meta.preTokenBalances ?? [],
    postTokenBalances: tx.meta.postTokenBalances ?? [],
    instructions: msg.instructions,
    inner: (tx.meta.innerInstructions ?? []).flatMap((x: { instructions: ReceiptIx[] }) => x.instructions),
  };
}
