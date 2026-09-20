import { sql } from "@/lib/db/client";
import "server-only";

/**
 * A cap on how often a code can be asked for
 *
 * Every verification Twilio sends is billed, so an open endpoint is somebody
 * else's script spending our balance overnight. It is also the difference
 * between a wrong number being a typo and a wrong number being a way to
 * pester whoever owns it.
 *
 * Counted in the database rather than in memory, because on serverless each
 * request may land on a fresh instance and an in memory counter would reset
 * under exactly the load it exists to stop. Without a database it falls back
 * to memory, which is still better than nothing on a single machine
 */

/** Codes to one number in the window */
const PER_NUMBER = 5;
/** Codes from one address in the window, for a script walking many numbers */
const PER_ADDRESS = 20;
const WINDOW_MINUTES = 60;

const memory: { phoneHash: string; ip: string; at: number }[] = [];

export type Verdict = { ok: true } | { ok: false; error: string };

const TOO_MANY: Verdict = {
  ok: false,
  error: "Too many codes requested. Wait an hour and try again",
};

function fromMemory(phoneHash: string, ip: string): Verdict {
  const cutoff = Date.now() - WINDOW_MINUTES * 60_000;
  while (memory.length > 0 && memory[0].at < cutoff) memory.shift();

  const byNumber = memory.filter((a) => a.phoneHash === phoneHash).length;
  const byAddress = memory.filter((a) => a.ip === ip).length;
  if (byNumber >= PER_NUMBER || byAddress >= PER_ADDRESS) return TOO_MANY;

  memory.push({ phoneHash, ip, at: Date.now() });
  return { ok: true };
}

/**
 * Records the attempt and says whether it is allowed
 *
 * The write happens either way: a refused attempt still counts, otherwise
 * hitting the limit would reset it
 */
export async function allowVerification(
  phoneHash: string,
  ip: string,
): Promise<Verdict> {
  if (!sql) return fromMemory(phoneHash, ip);

  try {
    const [row] = await sql<{ by_number: string; by_address: string }[]>`
      with recent as (
        select phone_hash, ip
          from verify_attempts
         where created_at > now() - ${`${WINDOW_MINUTES} minutes`}::interval
      ),
      inserted as (
        insert into verify_attempts (phone_hash, ip) values (${phoneHash}, ${ip})
      )
      select
        count(*) filter (where phone_hash = ${phoneHash}) as by_number,
        count(*) filter (where ip = ${ip})                as by_address
      from recent
    `;

    if (!row) return { ok: true };
    return Number(row.by_number) >= PER_NUMBER ||
      Number(row.by_address) >= PER_ADDRESS
      ? TOO_MANY
      : { ok: true };
  } catch (err) {
    // a limiter that is down must not take sign in down with it
    console.error("[rate-limit]", err instanceof Error ? err.message : err);
    return { ok: true };
  }
}

/** Best guess at who is asking, behind Vercel's proxy */
export function callerAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
