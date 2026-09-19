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
