import { refuseUnlessAdmin } from "@/lib/auth/admin";
import { runPendingBuybacks } from "@/lib/buyback";
import { fornumTokenMint } from "@/lib/pump/buyback";

/**
 * Run every buyback that is waiting
 *
 * A claim starts its own buyback right after it answers, so this is for the
 * ones that did not go through then: a failed buy, a burn to try again, or
 * shares that were too small on their own
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;

  if (!fornumTokenMint()) {
    return Response.json({ error: "FORNUM_TOKEN_MINT is not set" }, { status: 503 });
  }

  const results = await runPendingBuybacks();
  return Response.json({ results });
}
