import { Keypair } from "@solana/web3.js";
import { derivePath } from "ed25519-hd-key";
import * as bip39 from "bip39";
import "server-only";

/**
 * One wallet per launch, all derived from one phrase
 *
 * Every token is deployed from its own wallet, which is what makes its creator
 * fees its own: pump.fun seeds the creator vault by creator, so a wallet shared
 * between tokens would pool their fees with no way to tell them apart.
 *
 * The wallets are not stored. They are derived on demand from
 * LAUNCH_WALLETS_MNEMONIC by index, on the same path Phantom uses, so the
 * operator's Phantom and this server produce the same addresses in the same
 * order and there is one secret to protect rather than a hundred
 */

const PATH = (index: number) => `m/44'/501'/${index}'/0'`;

/** Cached because deriving the seed from a phrase is deliberately slow */
let cachedSeed: string | null = null;

function seedHex(): string | null {
  if (cachedSeed) return cachedSeed;

  const phrase = process.env.LAUNCH_WALLETS_MNEMONIC?.trim();
  if (!phrase) return null;
  if (!bip39.validateMnemonic(phrase)) {
    console.error("[wallets] LAUNCH_WALLETS_MNEMONIC is not a valid BIP39 phrase");
    return null;
  }

  cachedSeed = bip39.mnemonicToSeedSync(phrase).toString("hex");
  return cachedSeed;
}

export function hasLaunchWallets() {
  return seedHex() !== null;
}

/** The keypair for one launch. Null when no phrase is configured */
export function walletAt(index: number): Keypair | null {
  const seed = seedHex();
  if (seed === null) return null;
  if (!Number.isInteger(index) || index < 0 || index > 1_000_000) return null;

  const { key } = derivePath(PATH(index), seed);
  return Keypair.fromSeed(key);
}

export function addressAt(index: number): string | null {
  return walletAt(index)?.publicKey.toBase58() ?? null;
}
