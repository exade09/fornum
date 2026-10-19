/**
 * Builds, signs and simulates one buy-and-burn against mainnet, and sends
 * nothing. The check to run before switching BUYBACK_ENABLED on
 *
 *   npm run buyback:dry-run -- <budget lamports> [mint] [treasury address]
 *
 * Uses TREASURY_SECRET and PLATFORM_TOKEN_MINT from .env.local unless a mint
 * is given. With a treasury address instead of a key it simulates unsigned,
 * as that address. Prints the plan, the simulated spend and the network cost
 */
import { Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import { connect } from "@/lib/solana/read";
import { parseSettings } from "@/lib/buyback/rules";
import { signBuyback } from "@/lib/buyback/market";

const budget = Number(process.argv[2] ?? "1000000");
const { settings } = parseSettings(process.env);
const mint = process.argv[3] ?? settings.mainMint;
const address = process.argv[4];
const secret = process.env.TREASURY_SECRET;
if (!mint || (!secret && !address)) {
  console.error("Needs PLATFORM_TOKEN_MINT (or a mint argument) and TREASURY_SECRET (or an address)");
  process.exit(1);
}
const key = address ? new PublicKey(address) : (() => {
  try {
    return Keypair.fromSecretKey(bs58.decode(secret!.trim()));
  } catch {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secret!) as number[]));
  }
})();

const signed = await signBuyback(connect(), key, mint, budget, settings, 0);
console.log({
  treasury: (key instanceof Keypair ? key.publicKey : key).toBase58(),
  signed: key instanceof Keypair,
  mint,
  market: signed.plan.market,
  budgetLamports: budget,
  tokensBoughtAndBurned: signed.plan.tokenAmount.toString(),
  decimals: signed.decimals,
  ceilingLamports: signed.plan.maxQuoteLamports,
  simulatedMarketLamports: signed.simulatedMarketLamports,
  networkLamports: signed.expectedNetworkLamports,
  bytes: signed.tx.serialize().length,
  sent: false,
});
