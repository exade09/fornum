import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { Keypair } from "@solana/web3.js";
import { derivePath } from "ed25519-hd-key";
import * as bip39 from "bip39";
import bs58 from "bs58";

/**
 * The wallets the operator launches from
 *
 * One seed phrase, many accounts. A launch wallet has to be funded before it
 * can create a coin, because pump.fun charges the creator rent for the mint,
 * the metadata and the curve accounts, so there is no way around holding a
 * float. What there is a way around is holding a hundred separate secrets:
 * every wallet here is derived from a single phrase and can be regenerated
 * from it, so there is exactly one thing to back up and one thing to lose.
 *
 * The path is Phantom's own, m/44'/501'/i'/0', so importing the phrase into
 * Phantom reproduces the same addresses in the same order. Fund them first and
 * Phantom finds the funded ones for you on import.
 *
 * Usage
 *   node scripts/launch-wallets.mts new [words]   write a fresh phrase, 24 words by default
 *   node scripts/launch-wallets.mts list [count]  print addresses, secrets stay put
 *   node scripts/launch-wallets.mts key <index>   print one private key, for a single import
 *
 * The phrase is written to a file and never printed. Anything that reaches a
 * terminal reaches a scrollback, a log and whatever is reading over it
 */

const SEED_FILE = process.env.LAUNCH_WALLETS_SEED ?? "secrets/launch-wallets.seed";
const DEFAULT_COUNT = 100;

function readPhrase(): string {
  if (!existsSync(SEED_FILE)) {
    throw new Error(
      `No seed at ${SEED_FILE}. Run "node scripts/launch-wallets.mts new" first`,
    );
  }
  const phrase = readFileSync(SEED_FILE, "utf8").trim();
  if (!bip39.validateMnemonic(phrase)) {
    throw new Error(`${SEED_FILE} does not hold a valid BIP39 phrase`);
  }
  return phrase;
}

/** Index i of the phrase, on the path Phantom derives */
export function walletAt(phrase: string, index: number): Keypair {
  const seed = bip39.mnemonicToSeedSync(phrase).toString("hex");
  const { key } = derivePath(`m/44'/501'/${index}'/0'`, seed);
  return Keypair.fromSeed(key);
}

function cmdNew(words: number) {
  if (existsSync(SEED_FILE)) {
    throw new Error(
      `${SEED_FILE} already exists. Delete it yourself if you really mean to replace it, ` +
        `every wallet derived from the old phrase becomes unreachable`,
    );
  }
  if (words !== 12 && words !== 24) {
    throw new Error("Phrase length is 12 or 24 words");
  }

  // 128 bits for 12 words, 256 for 24
  const phrase = bip39.generateMnemonic(words === 24 ? 256 : 128);

  mkdirSync(dirname(SEED_FILE), { recursive: true });
  writeFileSync(SEED_FILE, `${phrase}\n`, { encoding: "utf8", mode: 0o600 });

  console.log(`Wrote a ${words} word phrase to ${SEED_FILE}`);
  console.log("It is not printed here on purpose. Open the file, copy it into a");
  console.log("password manager, then treat that file as the only copy you have");
  console.log(`\nFirst address: ${walletAt(phrase, 0).publicKey.toBase58()}`);
}

function cmdList(count: number) {
  const phrase = readPhrase();
  console.log(`index,address`);
  for (let i = 0; i < count; i++) {
    console.log(`${i},${walletAt(phrase, i).publicKey.toBase58()}`);
  }
}

function cmdKey(index: number) {
  const phrase = readPhrase();
  const keypair = walletAt(phrase, index);
  console.error(
    `Private key for index ${index}, ${keypair.publicKey.toBase58()}.\n` +
      `Printed on stderr so a redirect to a file does not catch it by accident.\n`,
  );
  console.log(bs58.encode(keypair.secretKey));
}

function main() {
  const [command, arg] = process.argv.slice(2);

  switch (command) {
    case "new":
      return cmdNew(arg ? Number(arg) : 24);
    case "list":
      return cmdList(arg ? Number(arg) : DEFAULT_COUNT);
    case "key": {
      if (arg === undefined) throw new Error("Which index? key <index>");
      return cmdKey(Number(arg));
    }
    default:
      console.log("Usage:");
      console.log("  node scripts/launch-wallets.mts new [12|24]");
      console.log("  node scripts/launch-wallets.mts list [count]");
      console.log("  node scripts/launch-wallets.mts key <index>");
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
