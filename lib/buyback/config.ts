import "server-only";
import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { hasDatabase } from "@/lib/db/client";
import { connect } from "@/lib/solana/read";
import { launchWalletAddress } from "@/lib/solana/wallet";
import { parseSettings, type BuybackSettings } from "@/lib/buyback/rules";

/**
 * Buyback settings, the treasury key and the cluster check
 *
 * Public addresses and the secret are separate settings: TREASURY_WALLET is
 * the address, TREASURY_SECRET (or a file named by TREASURY_SECRET_FILE) the
 * key, and the key must derive the address or nothing is signed. The key
 * never reaches a log, a page or the database
 */

/** Mainnet's genesis hash. SOLANA_GENESIS_HASH overrides it for devnet */
const MAINNET_GENESIS = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d";

function decodeSecret(raw: string): Keypair | null {
  const v = raw.trim();
  try {
    return Keypair.fromSecretKey(bs58.decode(v));
  } catch {
    try {
      return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(v) as number[]));
    } catch {
      return null;
    }
  }
}

let keyCache: { keypair: Keypair | null; problem: string | null } | null = null;

function loadTreasuryKey(treasury: string | null) {
  if (keyCache) return keyCache;
  let raw = process.env.TREASURY_SECRET;
  const file = process.env.TREASURY_SECRET_FILE;
  if (!raw && file) {
    try {
      raw = readFileSync(file, "utf8");
    } catch {
      return (keyCache = { keypair: null, problem: "TREASURY_SECRET_FILE cannot be read" });
    }
  }
  if (!raw) return (keyCache = { keypair: null, problem: "TREASURY_SECRET is not set" });
  const keypair = decodeSecret(raw);
  if (!keypair) return (keyCache = { keypair: null, problem: "TREASURY_SECRET is not a Solana secret key" });
  if (!treasury || keypair.publicKey.toBase58() !== treasury) {
    return (keyCache = { keypair: null, problem: "TREASURY_SECRET does not belong to TREASURY_WALLET" });
  }
  return (keyCache = { keypair, problem: null });
}

/** The settings, and everything that blocks sending */
export function buybackConfig(): {
  settings: BuybackSettings;
  problems: string[];
  treasuryKey: Keypair | null;
} {
  const { settings, problems } = parseSettings(process.env);
  if (!hasDatabase) problems.push("the buyback needs DATABASE_URL, the ledger lives there");
  if (settings.treasuryWallet) {
    try {
      new PublicKey(settings.treasuryWallet);
    } catch {
      problems.push("TREASURY_WALLET is not a valid key");
    }
    // the funding wallet pays for launches, the treasury must be a wallet of its own
    if (settings.treasuryWallet === launchWalletAddress()) {
      problems.push("TREASURY_WALLET is the funding wallet, give the treasury its own wallet");
    }
  }
  const key = settings.enabled || process.env.TREASURY_SECRET || process.env.TREASURY_SECRET_FILE
    ? loadTreasuryKey(settings.treasuryWallet)
    : { keypair: null, problem: null };
  if (key.problem && settings.enabled) problems.push(key.problem);
  if (!process.env.BUYBACK_ENCRYPTION_KEY && !process.env.AUTH_SECRET) {
    problems.push("BUYBACK_ENCRYPTION_KEY or AUTH_SECRET is needed to keep signed transactions");
  }
  return { settings, problems, treasuryKey: key.keypair };
}

/** Where the 20% goes at a claim. TREASURY_WALLET, or the older FORNUM_TREASURY */
export function treasuryWallet(): string | null {
  for (const v of [process.env.TREASURY_WALLET, process.env.FORNUM_TREASURY]) {
    const s = v?.trim();
    if (!s) continue;
    try {
      new PublicKey(s);
      return s;
    } catch {
      // keep looking
    }
  }
  return null;
}

/** The Fornum token, whose own fees do not feed its buyback */
export function platformMint(): string | null {
  return parseSettings(process.env).settings.mainMint;
}

let genesisOk: boolean | null = null;

/** Whether the RPC is the cluster the settings expect */
export async function onExpectedCluster() {
  if (genesisOk !== null) return genesisOk;
  const expected = process.env.SOLANA_GENESIS_HASH?.trim() || MAINNET_GENESIS;
  genesisOk = (await connect().getGenesisHash()) === expected;
  return genesisOk;
}

/* ------------------------------------------------------------------ */
/* Sealing signed transactions                                         */
/* ------------------------------------------------------------------ */

function sealKey() {
  const own = process.env.BUYBACK_ENCRYPTION_KEY;
  if (own) return createHash("sha256").update(own).digest();
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("No key to seal transactions with");
  return Buffer.from(hkdfSync("sha256", secret, "fornum", "buyback signed transactions", 32));
}

/** AES-256-GCM, stored as v1.iv.tag.data in base64 */
export function seal(bytes: Uint8Array) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sealKey(), iv);
  const data = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), data.toString("base64")].join(".");
}

export function unseal(sealed: string) {
  const [v, iv, tag, data] = sealed.split(".");
  if (v !== "v1") throw new Error("Unknown sealed format");
  const decipher = createDecipheriv("aes-256-gcm", sealKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return new Uint8Array(Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]));
}
