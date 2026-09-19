/**
 * SOL price in dollars, cached
 *
 * Amounts are held and moved in lamports. Dollars are only ever a label next to
 * them, so a stale or missing price degrades the page rather than breaking it
 */

let cached: { usd: number; at: number } | null = null;
const TTL_MS = 60_000;

export async function solPriceUsd(): Promise<number | null> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.usd;

  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
      { signal: AbortSignal.timeout(4000), next: { revalidate: 60 } },
    );
    if (!res.ok) return cached?.usd ?? null;

    const data = (await res.json()) as { solana?: { usd?: number } };
    const usd = data.solana?.usd;
    if (typeof usd !== "number" || !Number.isFinite(usd)) {
      return cached?.usd ?? null;
    }

    cached = { usd, at: Date.now() };
    return usd;
  } catch {
    // network hiccup, keep showing the last price we had
    return cached?.usd ?? null;
  }
}
