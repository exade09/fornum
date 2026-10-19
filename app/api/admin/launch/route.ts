import { hashPhone } from "@/lib/auth/session";
import { refuseUnlessAdmin } from "@/lib/auth/admin";
import { createToken } from "@/lib/db/store";
import { maskPhone, normalizePhone } from "@/lib/auth/verify";
import { balanceOf, isValidAddress } from "@/lib/solana/wallet";
import { walletAt } from "@/lib/solana/launch-wallets";
import { launchFleet } from "@/lib/launch-fleet";
import { issueLink } from "@/lib/auth/sign-in-links";
import { launchReply } from "@/lib/replies";
import { ipfsProblem, pin } from "@/lib/pump/ipfs";
import { createCoin } from "@/lib/pump/portal";
import type { Token } from "@/lib/types";

/**
 * The operator launches a coin from /admin
 *
 * Name, ticker and picture go in, the coin comes out on pump.fun: the picture
 * and the metadata are pinned to IPFS, the coin is deployed from a funded,
 * unused launch wallet, and the mint is recorded against the number that
 * asked. Nothing is copied by hand, so there is no mint to mistype.
 *
 * A JSON body with `mint` still records a coin deployed some other way
 */

// two uploads, a transaction and its confirmation
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Launches in flight, so a double click cannot spend one wallet twice */
const busyWallets = new Set<number>();

export async function POST(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;

  if (request.headers.get("content-type")?.includes("application/json")) {
    return recordExisting(request);
  }

  const form = await request.formData();
  const text = (k: string) => String(form.get(k) ?? "").trim();

  const name = text("name").slice(0, 32);
  const symbol = text("symbol").toUpperCase().slice(0, 10);
  const description = text("description").slice(0, 500);
  const phone = normalizePhone(text("phone"));
  const feesTo = text("feesTo") ? normalizePhone(text("feesTo")) : null;
  const image = form.get("image");
  const links = {
    twitter: text("twitter") || undefined,
    telegram: text("telegram") || undefined,
    website: text("website") || undefined,
  };

  if (!name || !symbol || !phone) {
    return Response.json(
      { error: "Name, ticker and the number that asked for it are required" },
      { status: 400 },
    );
  }
  if (!(image instanceof File) || image.size === 0) {
    return Response.json({ error: "Add the picture" }, { status: 400 });
  }
  if (!image.type.startsWith("image/")) {
    return Response.json({ error: "The picture has to be an image file" }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "The picture is over 4 MB" }, { status: 400 });
  }

  const ipfs = ipfsProblem();
  if (ipfs) return Response.json({ error: ipfs }, { status: 503 });

  // which wallet: the one picked, or the first funded one nobody used
  const fleet = await launchFleet();
  if (!fleet) {
    return Response.json(
      { error: "LAUNCH_WALLETS_MNEMONIC is not set, so there is no wallet to launch from" },
      { status: 503 },
    );
  }
  const asked = text("walletIndex") === "" ? null : Number(text("walletIndex"));
  const choice =
    asked === null
      ? fleet.find((w) => w.state === "ready" && !busyWallets.has(w.index))
      : fleet.find((w) => w.index === asked);

  if (!choice) {
    return Response.json(
      { error: "No funded, unused launch wallet is left. Fund more first" },
      { status: 409 },
    );
  }
  if (choice.state !== "ready" || busyWallets.has(choice.index)) {
    return Response.json(
      { error: `Wallet ${choice.index} is not free to launch from` },
      { status: 409 },
    );
  }

  const signer = walletAt(choice.index);
  if (!signer || signer.publicKey.toBase58() !== choice.address) {
    return Response.json({ error: "Could not derive the launch wallet" }, { status: 500 });
  }

  busyWallets.add(choice.index);
  try {
    let imageUrl: string;
    let metadataUri: string;
    try {
      imageUrl = await pin(image, `${symbol}-${image.name || "image"}`);
      const metadata = {
        name,
        symbol,
        description,
        image: imageUrl,
        showName: true,
        createdOn: "https://pump.fun",
        ...links,
      };
      metadataUri = await pin(
        new Blob([JSON.stringify(metadata)], { type: "application/json" }),
        `${symbol}-metadata.json`,
      );
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "IPFS upload failed" },
        { status: 502 },
      );
    }

    let mint: string;
    let signature: string;
    try {
      ({ mint, signature } = await createCoin({ creator: signer, name, symbol, metadataUri }));
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "The launch failed" },
        { status: 502 },
      );
    }

    // the coin exists from here on, so failures below must hand back the mint
    try {
      const baseline = await balanceOf(choice.address);
      const token = await save({
        mint,
        name,
        symbol,
        imageUrl,
        phone,
        feesTo,
        wallet: choice.address,
        walletIndex: choice.index,
        baseline,
      });
      return Response.json({
        ...(await replyFor(token, request)),
        signature,
        walletIndex: choice.index,
        imageUrl,
      });
    } catch (err) {
      console.error("[launch] coin is live but not recorded", mint, err);
      return Response.json(
        {
          error: `The coin is live (${mint}) but saving it failed: ${
            err instanceof Error ? err.message : "unknown error"
          }. Do not launch it again`,
          mint,
        },
        { status: 500 },
      );
    }
  } finally {
    busyWallets.delete(choice.index);
  }
}

async function save(input: {
  mint: string;
  name: string;
  symbol: string;
  imageUrl: string | null;
  phone: string;
  feesTo: string | null;
  wallet: string;
  walletIndex: number;
  baseline: number;
}) {
  const id =
    input.symbol.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20) +
    "-" +
    input.mint.slice(0, 4).toLowerCase();

  return createToken({
    id,
    mint: input.mint,
    name: input.name,
    symbol: input.symbol,
    status: "live",
    imageUrl: input.imageUrl,
    ownerHash: hashPhone(input.phone),
    ownerMasked: maskPhone(input.phone),
    assigneeHash: input.feesTo ? hashPhone(input.feesTo) : null,
    assigneeMasked: input.feesTo ? maskPhone(input.feesTo) : null,
    launchWallet: input.wallet,
    walletIndex: input.walletIndex,
    // what the wallet holds right after paying for the launch; everything that
    // lands on top of it later is the token's fees
    baselineLamports: input.baseline,
    feesAccruedLamports: 0,
    feesClaimedLamports: 0,
    marketCapUsd: 0,
    holders: 0,
  });
}

/**
 * The reply for the thread, with the mint and a way in
 *
 * When the fees are the launcher's own, it carries a one time sign in link for
 * their number. When they go to somebody else, that person never wrote to us,
 * so they sign in from the site instead
 */
async function replyFor(token: Token, request: Request) {
  let link: string | null = null;
  if (!token.assigneeHash) {
    try {
      link = new URL(await issueLink(token.ownerHash, token.ownerMasked), request.url).toString();
    } catch (err) {
      // the coin and its record are fine; the operator can make a link from Sign ins
      console.error("[launch] could not issue a sign in link", token.id, err);
    }
  }
  return {
    id: token.id,
    mint: token.mint,
    launchWallet: token.launchWallet,
    reply: launchReply({
      name: token.name,
      symbol: token.symbol,
      mint: token.mint,
      link,
      feesToMasked: token.assigneeMasked ?? null,
    }),
  };
}

/** A coin deployed outside /admin, recorded by its mint */
async function recordExisting(request: Request) {
  const body = (await request.json()) as {
    mint?: string;
    name?: string;
    symbol?: string;
    phone?: string;
    feesTo?: string;
    walletIndex?: number;
    imageUrl?: string;
  };
  const phone = normalizePhone(body.phone ?? "");
  if (!body.mint || !isValidAddress(body.mint)) {
    return Response.json({ error: "Mint address is not valid" }, { status: 400 });
  }
  if (!body.name || !body.symbol || !phone) {
    return Response.json(
      { error: "Name, ticker and the number that asked for it are required" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(body.walletIndex) || body.walletIndex! < 0) {
    return Response.json({ error: "Say which launch wallet deployed it" }, { status: 400 });
  }
  const signer = walletAt(body.walletIndex!);
  if (!signer) {
    return Response.json({ error: "LAUNCH_WALLETS_MNEMONIC is not set" }, { status: 503 });
  }
  const wallet = signer.publicKey.toBase58();
  const token = await save({
    mint: body.mint.trim(),
    name: body.name.trim(),
    symbol: body.symbol.trim().toUpperCase(),
    imageUrl: body.imageUrl ?? null,
    phone,
    feesTo: body.feesTo ? normalizePhone(body.feesTo) : null,
    wallet,
    walletIndex: body.walletIndex!,
    baseline: await balanceOf(wallet),
  });
  return Response.json(await replyFor(token, request));
}
