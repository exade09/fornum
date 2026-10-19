import "server-only";
import {
  ComputeBudgetProgram,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  type Keypair,
} from "@solana/web3.js";
import { OnlinePumpSdk } from "@pump-fun/pump-sdk";
import { connect } from "@/lib/solana/read";

/**
 * Pays out a native coin's waiting fees through pump.fun's own distribution
 *
 * pump.fun splits them itself, 80% to the launch wallet and 20% to the
 * treasury, in one instruction; the SDK puts the sweeps of fees still on the
 * curve or in the pool, and the move from PumpSwap, in front of it. Anyone may
 * send it. `payer` signs and pays the network fee and any rent the sweeps
 * need, which the treasury ledger accounts for separately. Returns null when
 * there is not yet enough waiting for the program to distribute
 */
export async function distributeNative(mint: string, payer: Keypair): Promise<string | null> {
  const connection = connect();
  const sdk = new OnlinePumpSdk(connection);
  const key = new PublicKey(mint);

  const min = await sdk.getMinimumDistributableFee(key, payer.publicKey, { payer: payer.publicKey });
  if (!min.canDistribute) return null;

  const { instructions } = await sdk.buildDistributeCreatorFeesInstructions(key, { payer: payer.publicKey });
  const latest = await connection.getLatestBlockhash("confirmed");
  const tx = new VersionedTransaction(
    new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: latest.blockhash,
      instructions: [
        ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }),
        ...instructions,
      ],
    }).compileToV0Message(),
  );
  tx.sign([payer]);

  const sim = await connection.simulateTransaction(tx, { sigVerify: true });
  if (sim.value.err) {
    throw new Error(`The distribution would fail: ${JSON.stringify(sim.value.err)} ${(sim.value.logs ?? []).slice(-2).join(" | ")}`);
  }
  const signature = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: true, maxRetries: 3 });
  const done = await connection.confirmTransaction(
    { signature, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight },
    "confirmed",
  );
  if (done.value.err) throw new Error(`The distribution failed on chain: ${JSON.stringify(done.value.err)}`);
  return signature;
}
