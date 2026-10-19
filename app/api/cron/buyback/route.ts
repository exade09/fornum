import { timingSafeEqual } from "node:crypto";
import { runBuybackPass } from "@/lib/buyback/worker";

/**
 * The buyback heartbeat
 *
 * One call runs two passes 30 seconds apart, so a scheduler calling it every
 * minute (Vercel Cron on Pro, or any external cron) gives a pass every 30
 * seconds: distribute what pump.fun holds for native coins, read the
 * receipts, buy back and burn. Vercel's daily cron in vercel.json is the
 * fallback on the free plan. CRON_SECRET goes as a bearer token (or ?key=
 * for schedulers that cannot set headers); without it set, everyone is refused
 */
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const key = new URL(request.url).searchParams.get("key");
  const given = request.headers.get("authorization") ?? (key ? `Bearer ${key}` : "");
  const expected = `Bearer ${secret}`;
  if (
    !secret ||
    given.length !== expected.length ||
    !timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  ) {
    return Response.json({ error: "Not allowed" }, { status: 401 });
  }
  const started = Date.now();
  const first = await runBuybackPass(25_000);
  const wait = 30_000 - (Date.now() - started);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  const second = await runBuybackPass(25_000);
  return Response.json({ log: [...first.log, ...second.log] });
}
