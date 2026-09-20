import { readFileSync, existsSync } from "node:fs";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { derivePath } from "ed25519-hd-key";
import * as bip39 from "bip39";
import { connect, RPC_URL } from "../lib/solana/read.ts";

/**
 * Tops the launch wallets up to a working balance
 *
 * A launch wallet pays the creator's side of a pump.fun launch, which on a
 * measured mainnet launch came to 0.01169 SOL: 0.00585 for the metadata
 * account, 0.00290 for the mint, 0.00293 for the curve accounts and the rest
 * in transaction fees. The default target here leaves headroom on top of that
 * for the handful of transactions a wallet signs afterwards.
 *
 * Nothing is sent without --execute. The default is a plan you can read, with
 * balances taken live, because the failure mode of getting this wrong is
 * sending real money to addresses derived from the wrong phrase.
 *
 * Usage
 *   node scripts/fund-launch-wallets.mts [count] [--sol 0.015] [--execute]
 *
 * The source is LAUNCH_WALLET_SECRET. Every destination is derived from the
 * seed phrase, so this script never needs their private keys
 */

const SEED_FILE = process.env.LAUNCH_WALLETS_SEED ?? "secrets/launch-wallets.seed";

/** Enough for one launch plus room for the transactions that follow it */
const DEFAULT_TARGET_SOL = 0.015;

/** Transfers per transaction. A legacy transaction runs out of room past ~20 */
const PER_TX = 15;

function arg(flag: string) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

/**
 * Decoded here rather than imported from lib/solana/wallet.ts, which is marked
 * server-only and belongs to the app rather than to the toolbox
 */
function sourceKeypair(): Keypair {
  const secret = process.env.LAUNCH_WALLET_SECRET;
  if (!secret) throw new Error("LAUNCH_WALLET_SECRET is not set");
  try {
    return Keypair.fromSecretKey(bs58.decode(secret.trim()));
  } catch {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret) as number[]));
  }
}

function destinations(count: number): PublicKey[] {
  if (!existsSync(SEED_FILE)) {
    throw new Error(`No seed at ${SEED_FILE}, run launch-wallets.mts new first`);
  }
  const phrase = readFileSync(SEED_FILE, "utf8").trim();
  if (!bip39.validateMnemonic(phrase)) {
    throw new Error(`${SEED_FILE} does not hold a valid BIP39 phrase`);
  }
  const seed = bip39.mnemonicToSeedSync(phrase).toString("hex");

  return Array.from({ length: count }, (_, i) => {
    const { key } = derivePath(`m/44'/501'/${i}'/0'`, seed);
    return Keypair.fromSeed(key).publicKey;
  });
}

const sol = (lamports: number) => (lamports / LAMPORTS_PER_SOL).toFixed(6);

async function main() {
  const count = Number(process.argv[2]) || 100;
  const target = Math.round(
    Number(arg("--sol") ?? DEFAULT_TARGET_SOL) * LAMPORTS_PER_SOL,
  );
  const execute = process.argv.includes("--execute");

  const connection = connect();
  const source = sourceKeypair();
  const wallets = destinations(count);

  console.log(`rpc     ${RPC_URL}`);
  console.log(`source  ${source.publicKey.toBase58()}`);
  console.log(`wallets ${count}`);
  console.log(`target  ${sol(target)} SOL each\n`);

  // live balances, so re-running only tops up what actually fell short
  const balances: number[] = [];
  for (let i = 0; i < wallets.length; i += 100) {
    const slice = wallets.slice(i, i + 100);
    const infos = await connection.getMultipleAccountsInfo(slice);
    balances.push(...infos.map((info) => info?.lamports ?? 0));
  }

  const jobs = wallets
    .map((pubkey, i) => ({ pubkey, index: i, top: target - balances[i] }))
    .filter((j) => j.top > 0);

  const funded = count - jobs.length;
  const total = jobs.reduce((sum, j) => sum + j.top, 0);
  const fees = Math.ceil(jobs.length / PER_TX) * 5000;

  console.log(`already at target  ${funded}`);
  console.log(`to top up          ${jobs.length}`);
  console.log(`sum of top ups     ${sol(total)} SOL`);
  console.log(`transaction fees   ${sol(fees)} SOL`);
  console.log(`total to spend     ${sol(total + fees)} SOL\n`);

  if (jobs.length === 0) {
    console.log("Nothing to do");
    return;
  }

  const available = await connection.getBalance(source.publicKey);
  console.log(`source holds       ${sol(available)} SOL`);
  if (available < total + fees) {
    throw new Error(
      `Short by ${sol(total + fees - available)} SOL. Top the source up first`,
    );
  }

  if (!execute) {
    console.log("\nThis was a plan. Add --execute to actually send");
    for (const j of jobs.slice(0, 5)) {
      console.log(`  ${j.index}  ${j.pubkey.toBase58()}  +${sol(j.top)}`);
    }
    if (jobs.length > 5) console.log(`  ... and ${jobs.length - 5} more`);
    return;
  }

  console.log("");
  for (let i = 0; i < jobs.length; i += PER_TX) {
    const batch = jobs.slice(i, i + PER_TX);
    const tx = new Transaction();
    for (const j of batch) {
      tx.add(
        SystemProgram.transfer({
          fromPubkey: source.publicKey,
          toPubkey: j.pubkey,
          lamports: j.top,
        }),
      );
    }

    const signature = await sendAndConfirmTransaction(connection, tx, [source], {
      commitment: "confirmed",
    });
    console.log(
      `sent ${batch.length} (indexes ${batch[0].index}..${batch[batch.length - 1].index})  ${signature}`,
    );
  }

  console.log("\nDone");
}

main().catch((err) => {
  console.error("funding failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
