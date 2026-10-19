/**
 * Sends the same amount of SOL to every address in a text file
 *
 *   node --env-file=.env.local scripts/send-sol.mts <file> [--sol 0.015] [--execute]
 *
 * The file holds one address per line; blank lines are skipped. The sender is
 * SENDER_SECRET in .env.local (base58, or the JSON byte array a wallet
 * exports). Without --execute it only prints the plan: sender, balance, every
 * address and the total, and checks there is enough to cover it.
 *
 * Transfers go out 15 per transaction. Each transaction is confirmed before
 * the next one, and the signatures are printed, so a run that stops halfway
 * shows exactly what was already sent
 */
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { readFileSync } from "node:fs";
import bs58 from "bs58";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const execute = args.includes("--execute");
const solArg = args.indexOf("--sol");
const sol = solArg >= 0 ? Number(args[solArg + 1]) : 0.015;

if (!file || !Number.isFinite(sol) || sol <= 0) {
  console.error("Usage: node --env-file=.env.local scripts/send-sol.mts <file> [--sol 0.015] [--execute]");
  process.exit(1);
}

const raw = process.env.SENDER_SECRET?.trim();
if (!raw) {
  console.error("Put the sender's key in .env.local as SENDER_SECRET=...");
  process.exit(1);
}
let sender: Keypair;
try {
  sender = raw.startsWith("[")
    ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw) as number[]))
    : Keypair.fromSecretKey(bs58.decode(raw));
} catch {
  console.error("SENDER_SECRET is not a Solana secret key");
  process.exit(1);
}

const lines = readFileSync(file, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean);
const bad = lines.filter((l) => {
  try {
    new PublicKey(l);
    return false;
  } catch {
    return true;
  }
});
if (bad.length > 0) {
  console.error(`Not addresses: ${bad.join(", ")}`);
  process.exit(1);
}
const addresses = [...new Set(lines)];
if (addresses.length !== lines.length) console.log(`Skipping ${lines.length - addresses.length} repeated address(es)`);

const lamports = Math.round(sol * LAMPORTS_PER_SOL);
const BATCH = 15;
const batches = Math.ceil(addresses.length / BATCH);
const feeRoom = batches * 10_000;
const total = lamports * addresses.length;

async function main() {
  const connection = new Connection(process.env.SOLANA_RPC_URL ?? "https://api.mainnet-beta.solana.com", "confirmed");
  const balance = await connection.getBalance(sender.publicKey);

  console.log(`Sender   ${sender.publicKey.toBase58()}`);
  console.log(`Balance  ${balance / LAMPORTS_PER_SOL} SOL`);
  console.log(`Sending  ${sol} SOL to ${addresses.length} addresses = ${total / LAMPORTS_PER_SOL} SOL, plus about ${feeRoom / LAMPORTS_PER_SOL} in fees`);
  addresses.forEach((a, i) => console.log(`  ${String(i + 1).padStart(2)}  ${a}`));

  if (balance < total + feeRoom) {
    const fits = Math.floor((balance - feeRoom) / lamports);
    console.error(`Not enough: short by ${(total + feeRoom - balance) / LAMPORTS_PER_SOL} SOL. This balance covers ${Math.max(fits, 0)} addresses`);
    process.exitCode = 1;
    return;
  }
  if (!execute) {
    console.log("\nNothing sent. Run again with --execute to send");
    return;
  }

  for (let i = 0; i < addresses.length; i += BATCH) {
    const chunk = addresses.slice(i, i + BATCH);
    const tx = new Transaction();
    for (const a of chunk) {
      tx.add(SystemProgram.transfer({ fromPubkey: sender.publicKey, toPubkey: new PublicKey(a), lamports }));
    }
    const signature = await sendAndConfirmTransaction(connection, tx, [sender], { commitment: "confirmed" });
    console.log(`Sent to ${i + 1}-${i + chunk.length}: https://solscan.io/tx/${signature}`);
  }
  console.log("Done");
}

await main();
