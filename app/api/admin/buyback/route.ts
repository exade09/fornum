import { refuseUnlessAdmin } from "@/lib/auth/admin";
import { runBuybackPass } from "@/lib/buyback/worker";

/**
 * One buyback pass, from the button on /admin
 *
 * Confirms claim receipts, moves the open job and starts a new one when the
 * ledger allows. With BUYBACK_ENABLED off it still reconciles, it only does
 * not start or send anything
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;
  const { log } = await runBuybackPass(45_000);
  return Response.json({ log });
}
