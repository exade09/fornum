import { getToken } from "@/lib/db/store";

/**
 * A token's picture, served from the site
 *
 * Pictures live on IPFS, and the public gateways rate limit hard: ipfs.io
 * answers 429 often enough that an image on the page simply does not show.
 * So the site fetches the picture itself, trying gateways in turn, and serves
 * it with a long cache, which the CDN then holds. The content behind a CID
 * never changes, so caching it for a year is right.
 *
 * Only a token's own picture can be fetched, and only as an image, so this is
 * not a way to serve arbitrary IPFS content from our domain
 */

export const maxDuration = 30;

const GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
];

const CID = /\/ipfs\/([A-Za-z0-9]{46,})/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = await getToken(id);
  const cid = token?.imageUrl?.match(CID)?.[1];
  if (!cid) return new Response("Not found", { status: 404 });

  for (const gateway of GATEWAYS) {
    try {
      const res = await fetch(`${gateway}${cid}`, { signal: AbortSignal.timeout(9_000) });
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.startsWith("image/")) continue;
      return new Response(await res.arrayBuffer(), {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        },
      });
    } catch {
      // slow or down, the next gateway may answer
    }
  }
  return new Response("Picture unavailable", { status: 502, headers: { "Cache-Control": "no-store" } });
}
