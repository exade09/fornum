import { createHash, timingSafeEqual } from "node:crypto";
import { runBuybackPass } from "@/lib/buyback/worker";

/**
 * The buyback heartbeat
 *
 * One call runs two passes 30 seconds apart: distribute what pump.fun holds
 * for native coins, read the receipts, buy back and burn. GitHub Actions calls
 * it every 5 minutes (.github/workflows/buyback.yml), Vercel's cron once a day
 * as a fallback, and claims start a pass on their own.
 *
 * Accepted keys: CRON_SECRET from the host, the PASS_KEY secret on GitHub,
 * or the key in the cron-job.org URL; of the last two only the SHA-256 is here. The hash can be public:
 * it does not give the key back. Anyone else is refused
 */
export const maxDuration = 60;

// GitHub Actions (PASS_KEY) and cron-job.org; only the SHA-256 of each key is here
const KEY_SHA256 = [
  "ed5efed0ce7f6e4e91b8be2c6573552816a873131886660bfaef9f2d10d7eb89",
  "a35a09ea87060bf308d76895dba0b9f443b13e0ed1c3740782e1df9aa180f83e",
];

function same(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

function allowed(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const key = header.startsWith("Bearer ") ? header.slice(7) : new URL(request.url).searchParams.get("key") ?? "";
  if (!key) return false;
  const secret = process.env.CRON_SECRET;
  if (secret && same(Buffer.from(key), Buffer.from(secret))) return true;
  const digest = createHash("sha256").update(key).digest();
  return KEY_SHA256.some((h) => same(digest, Buffer.from(h, "hex")));
}

export async function GET(request: Request) {
  if (!allowed(request)) {
    return Response.json({ error: "Not allowed" }, { status: 401 });
  }
  const started = Date.now();
  const first = await runBuybackPass(25_000);
  const wait = 30_000 - (Date.now() - started);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  const second = await runBuybackPass(25_000);
  return Response.json({ log: [...first.log, ...second.log] });
}
