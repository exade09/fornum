import { timingSafeEqual } from "node:crypto";
import { runBuybackPass } from "@/lib/buyback/worker";

/**
 * The daily safety net for the buyback, called by Vercel Cron (vercel.json)
 *
 * Claims start a pass on their own and /admin has a button; this catches
 * whatever both missed. Vercel sends CRON_SECRET as a bearer token, and
 * without CRON_SECRET set the route refuses everyone
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (
    !secret ||
    given.length !== expected.length ||
    !timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  ) {
    return Response.json({ error: "Not allowed" }, { status: 401 });
  }
  const { log } = await runBuybackPass(50_000);
  return Response.json({ log });
}
