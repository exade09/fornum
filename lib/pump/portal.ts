import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { connect } from "@/lib/solana/read";
import "server-only";

/**
 * pump.fun transactions through PumpPortal's local transaction API
 *
 * Used for creating coins and for buying back the Fornum token: PumpPortal
 * builds the transaction against pump.fun's current program, the server signs
 * it with the launch wallet (and the new mint, for a create) and sends it
 * through our own RPC. No key ever leaves the server. PumpPortal takes 0.5% of
 * every buy, which is why the dev buy is kept tiny. Collecting fees is built
 * in-house, see lib/pump/collect.ts
 */

const TRADE_LOCAL = "https://pumpportal.fun/api/trade-local";

/** SOL bought by the launch wallet in the create transaction */
export function devBuySol() {
  const v = Number(process.env.LAUNCH_DEV_BUY_SOL ?? "0.0001");
  return Number.isFinite(v) && v >= 0 ? v : 0.0001;
}

export const PRIORITY_FEE_SOL = 0.00005;

export async function build(body: Record<string, unknown>) {
  const res = await fetch(TRADE_LOCAL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status !== 200) {
    const text = await res.text().catch(() => "");
    throw new Error(`PumpPortal refused the transaction (${res.status}) ${text.slice(0, 200)}`);
  }
  return VersionedTransaction.deserialize(new Uint8Array(await res.arrayBuffer()));
}

export async function signAndSend(tx: VersionedTransaction, signers: Keypair[]) {
  tx.sign(signers);
  const connection = connect();
  const signature = await connection.sendTransaction(tx, { maxRetries: 3 });
  const latest = await connection.getLatestBlockhash("confirmed");
  const result = await connection.confirmTransaction(
    {
      signature,
      blockhash: tx.message.recentBlockhash,
      lastValidBlockHeight: latest.lastValidBlockHeight,
    },
    "confirmed",
  );
  if (result.value.err) {
    throw new Error(`Transaction failed on chain: ${JSON.stringify(result.value.err)}`);
  }
  return signature;
}

/**
 * Deploys a coin on pump.fun from the given launch wallet
 *
 * The mint keypair is made here, so the mint address is known before anything
 * is sent and nobody has to copy it from anywhere
 */
export async function createCoin(input: {
  creator: Keypair;
  name: string;
  symbol: string;
  metadataUri: string;
}) {
  const mint = Keypair.generate();
  const tx = await build({
    publicKey: input.creator.publicKey.toBase58(),
    action: "create",
    tokenMetadata: { name: input.name, symbol: input.symbol, uri: input.metadataUri },
    mint: mint.publicKey.toBase58(),
    denominatedInSol: "true",
    amount: devBuySol(),
    slippage: 10,
    priorityFee: PRIORITY_FEE_SOL,
    pool: "pump",
  });
  const signature = await signAndSend(tx, [mint, input.creator]);
  return { mint: mint.publicKey.toBase58(), signature };
}
