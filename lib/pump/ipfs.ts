import "server-only";

/**
 * Pinning to IPFS through Pinata
 *
 * pump.fun reads a token's name, picture and links from a metadata file on
 * IPFS, and its own upload endpoint is no longer offered, so the picture and
 * that file are pinned here. PINATA_JWT is the API key's JWT from pinata.cloud
 */

const UPLOAD_URL = "https://uploads.pinata.cloud/v3/files";
export const IPFS_GATEWAY = "https://ipfs.io/ipfs/";

export function ipfsProblem(): string | null {
  return process.env.PINATA_JWT ? null : "PINATA_JWT is not set, so the picture cannot be uploaded";
}

/** Pins one file and returns its public URL */
export async function pin(file: Blob, name: string): Promise<string> {
  const jwt = process.env.PINATA_JWT?.trim();
  if (!jwt) throw new Error(ipfsProblem()!);

  const form = new FormData();
  form.append("network", "public");
  form.append("file", file, name);
  form.append("name", name);

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`IPFS upload failed (${res.status}) ${text.slice(0, 200)}`);
  }
  const body = (await res.json()) as { data?: { cid?: string } };
  const cid = body.data?.cid;
  if (!cid) throw new Error("IPFS upload returned no CID");
  return `${IPFS_GATEWAY}${cid}`;
}
