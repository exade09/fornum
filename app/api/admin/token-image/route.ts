import { refuseUnlessAdmin } from "@/lib/auth/admin";
import { getToken, setImage } from "@/lib/db/store";
import { ipfsProblem, pin } from "@/lib/pump/ipfs";

/**
 * Set or replace the picture a token shows on the site
 *
 * pump.fun's own copy is fixed at launch and cannot be changed from here; this
 * is for the site, and for coins recorded before pictures were kept
 */

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;

  const form = await request.formData();
  const tokenId = String(form.get("tokenId") ?? "");
  const image = form.get("image");

  const token = tokenId ? await getToken(tokenId) : null;
  if (!token) return Response.json({ error: "No such token" }, { status: 404 });

  if (!(image instanceof File) || image.size === 0 || !image.type.startsWith("image/")) {
    return Response.json({ error: "Pick an image file" }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "The picture is over 4 MB" }, { status: 400 });
  }

  const ipfs = ipfsProblem();
  if (ipfs) return Response.json({ error: ipfs }, { status: 503 });

  let imageUrl: string;
  try {
    imageUrl = await pin(image, `${token.symbol}-${image.name || "image"}`);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 502 },
    );
  }

  await setImage(token.id, imageUrl);
  return Response.json({ tokenId: token.id, imageUrl });
}

/** Back to the mark drawn from the symbol */
export async function DELETE(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;
  const { tokenId } = (await request.json().catch(() => ({}))) as { tokenId?: string };
  if (!tokenId || !(await setImage(tokenId, null))) {
    return Response.json({ error: "No such token" }, { status: 404 });
  }
  return Response.json({ tokenId, imageUrl: null });
}
