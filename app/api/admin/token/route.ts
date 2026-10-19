import { refuseUnlessAdmin } from "@/lib/auth/admin";
import { deleteToken, getToken } from "@/lib/db/store";

/**
 * Remove a launch that should not be on the list
 *
 * Same shared secret as the other operator routes. Destructive, so it asks for
 * the token id twice: once to say what to remove and once to confirm, which is
 * the difference between a deliberate removal and a misclick
 */
export async function DELETE(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;

  const { tokenId, confirm } = (await request.json()) as {
    tokenId?: string;
    confirm?: string;
  };

  if (!tokenId) {
    return Response.json({ error: "Which token?" }, { status: 400 });
  }
  if (confirm !== tokenId) {
    return Response.json(
      { error: "Type the token id to confirm the removal" },
      { status: 400 },
    );
  }

  const token = await getToken(tokenId);
  if (!token) {
    return Response.json({ error: "No such token" }, { status: 404 });
  }

  const removed = await deleteToken(tokenId);
  console.info(`[admin] removed token ${tokenId} (${token.symbol})`);

  return Response.json({ removed, id: tokenId, symbol: token.symbol });
}
