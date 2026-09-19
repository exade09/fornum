import { readSession, hashPhone } from "@/lib/auth/session";
import { assignToken, getToken } from "@/lib/db/store";
import { maskPhone, normalizePhone } from "@/lib/auth/verify";
import { feeRecipientHash } from "@/lib/types";

/**
 * Hand the fees of a token to another number
 *
 * The new holder is stored as a hash, same as the owner, so nothing here needs
 * the number in the clear afterwards. One way on purpose: whoever receives it
 * can hand it on again, but the sender cannot pull it back
 */
export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }

  const { tokenId, phone } = (await request.json()) as {
    tokenId?: string;
    phone?: string;
  };

  const normalized = normalizePhone(phone ?? "");
  if (!tokenId || !normalized) {
    return Response.json(
      { error: "Send a token and a full number with country code" },
      { status: 400 },
    );
  }

  const token = await getToken(tokenId);
  if (!token) {
    return Response.json({ error: "No such token" }, { status: 404 });
  }

  if (feeRecipientHash(token) !== session.sub) {
    return Response.json(
      { error: "These fees belong to another number" },
      { status: 403 },
    );
  }

  const hash = hashPhone(normalized);
  if (hash === session.sub) {
    return Response.json(
      { error: "That is the number they already belong to" },
      { status: 400 },
    );
  }

  const updated = await assignToken(token.id, hash, maskPhone(normalized));
  if (!updated) {
    return Response.json({ error: "Could not hand them over" }, { status: 500 });
  }

  return Response.json({ assignedTo: updated.assigneeMasked });
}
