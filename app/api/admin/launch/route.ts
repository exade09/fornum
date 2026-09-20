import { randomUUID } from "node:crypto";
import { hashPhone } from "@/lib/auth/session";
import { createToken } from "@/lib/db/store";
import { maskPhone, normalizePhone } from "@/lib/auth/verify";
import { balanceOf, isValidAddress, launchWalletAddress } from "@/lib/solana/wallet";
import { addressAt } from "@/lib/solana/launch-wallets";

/**
 * The operator records a launch they just did by hand
 *
 * Guarded by a shared secret in ADMIN_TOKEN rather than a login, because this
 * is one person with a console, not a user account system
 */
export async function POST(request: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return Response.json(
      { error: "ADMIN_TOKEN is not set on this deployment" },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ error: "Not allowed" }, { status: 401 });
  }

  const body = (await request.json()) as {
    mint?: string;
    name?: string;
    symbol?: string;
    phone?: string;
    feesTo?: string;
    walletIndex?: number;
  };

  const phone = normalizePhone(body.phone ?? "");
  const feesTo = body.feesTo ? normalizePhone(body.feesTo) : null;

  if (!body.mint || !isValidAddress(body.mint)) {
    return Response.json({ error: "Mint address is not valid" }, { status: 400 });
  }
  if (!body.name || !body.symbol || !phone) {
    return Response.json(
      { error: "Name, ticker and the number that asked for it are required" },
      { status: 400 },
    );
  }

  /**
   * Which wallet deployed this mint
   *
   * A launch wallet is funded before it can deploy anything, so the balance
   * right after the launch is the operator's float, not the token's fees. It
   * is recorded here as the line everything is measured from, which is what
   * lets the site read what a token has earned straight off the chain instead
   * of being told
   */
  const index = body.walletIndex;
  let wallet: string | null;
  let baseline = 0;

  if (index === undefined || index === null) {
    // the old shared wallet, kept so launches recorded before this still work
    wallet = launchWalletAddress();
  } else {
    if (!Number.isInteger(index) || index < 0) {
      return Response.json(
        { error: "Wallet index has to be a whole number, zero or above" },
        { status: 400 },
      );
    }
    wallet = addressAt(index);
    if (!wallet) {
      return Response.json(
        { error: "LAUNCH_WALLETS_MNEMONIC is not set, so that wallet cannot be derived" },
        { status: 503 },
      );
    }
  }

  if (!wallet) {
    return Response.json(
      { error: "No launch wallet is configured, so fees would have nowhere to accrue" },
      { status: 503 },
    );
  }

  try {
    baseline = await balanceOf(wallet);
  } catch {
    return Response.json(
      { error: "Could not read the launch wallet balance, try again" },
      { status: 502 },
    );
  }

  const slug =
    body.symbol.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20) +
    "-" +
    body.mint.slice(0, 4).toLowerCase();

  const token = await createToken({
    id: slug,
    mint: body.mint.trim(),
    name: body.name.trim(),
    symbol: body.symbol.trim().toUpperCase(),
    status: "live",
    ownerHash: hashPhone(phone),
    ownerMasked: maskPhone(phone),
    assigneeHash: feesTo ? hashPhone(feesTo) : null,
    assigneeMasked: feesTo ? maskPhone(feesTo) : null,
    launchWallet: wallet,
    walletIndex: index ?? null,
    baselineLamports: baseline,
    feesAccruedLamports: 0,
    feesClaimedLamports: 0,
    marketCapUsd: 0,
    holders: 0,
  });

  return Response.json({
    id: token.id,
    mint: token.mint,
    launchWallet: token.launchWallet,
    baselineLamports: token.baselineLamports,
  });
}
