import { randomUUID } from "node:crypto";
import { hashPhone } from "@/lib/auth/session";
import { createToken } from "@/lib/db/store";
import { maskPhone, normalizePhone } from "@/lib/auth/verify";
import { isValidAddress, launchWalletAddress } from "@/lib/solana/wallet";

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

  const wallet = launchWalletAddress();
  if (!wallet) {
    return Response.json(
      { error: "LAUNCH_WALLET_SECRET is not set, so fees would have nowhere to accrue" },
      { status: 503 },
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
    feesAccruedLamports: 0,
    feesClaimedLamports: 0,
    marketCapUsd: 0,
    holders: 0,
  });

  return Response.json({ id: token.id, mint: token.mint });
}
