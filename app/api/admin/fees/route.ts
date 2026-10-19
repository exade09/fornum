import { refuseUnlessAdmin } from "@/lib/auth/admin";
import { getToken, setAccrued } from "@/lib/db/store";

/**
 * Record what a token has earned so far
 *
 * Until a claimer job watches the chain, the operator claims the creator fees
 * out of pump.fun into the launch wallet and then says here how much of that
 * balance belongs to which token. One wallet holds them all, so without this
 * the first claim would take everybody's money
 */
export async function POST(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;

  const { tokenId, lamports } = (await request.json()) as {
    tokenId?: string;
    lamports?: number;
  };

  if (!tokenId || typeof lamports !== "number" || !Number.isFinite(lamports)) {
    return Response.json(
      { error: "Send a token and an amount in lamports" },
      { status: 400 },
    );
  }
  if (lamports < 0) {
    return Response.json({ error: "Amount cannot be negative" }, { status: 400 });
  }

  const token = await getToken(tokenId);
  if (!token) {
    return Response.json({ error: "No such token" }, { status: 404 });
  }
  if (lamports < token.feesClaimedLamports) {
    return Response.json(
      { error: "That is less than has already been claimed" },
      { status: 400 },
    );
  }

  await setAccrued(tokenId, lamports);
  return Response.json({ tokenId, feesAccruedLamports: lamports });
}
