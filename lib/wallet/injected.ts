/**
 * Browser wallets, read straight off window
 *
 * Linking a payout address only needs the public key, so there is no adapter
 * library here: each wallet injects a provider, connect() asks the visitor,
 * and the key comes back on the result or on the provider afterwards
 */

type Key = { toString(): string };

type Provider = {
  connect: () => Promise<{ publicKey?: Key } | void | boolean>;
  publicKey?: Key | null;
};

type WalletWindow = Window & {
  phantom?: { solana?: Provider & { isPhantom?: boolean } };
  solflare?: Provider & { isSolflare?: boolean };
  backpack?: Provider;
};

export type WalletId = "phantom" | "solflare" | "backpack";

function provider(id: WalletId): Provider | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as WalletWindow;
  if (id === "phantom") return w.phantom?.solana;
  if (id === "solflare") return w.solflare?.isSolflare ? w.solflare : undefined;
  return w.backpack;
}

export function installed(id: WalletId) {
  return Boolean(provider(id));
}

/** The address of the wallet the visitor approves, or null if they decline */
export async function connectWallet(id: WalletId): Promise<string | null> {
  const p = provider(id);
  if (!p) return null;
  try {
    const result = await p.connect();
    const key =
      (result && typeof result === "object" && result.publicKey) || p.publicKey;
    return key ? key.toString() : null;
  } catch {
    return null;
  }
}
