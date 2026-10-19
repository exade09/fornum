import "server-only";
import { sql } from "@/lib/db/client";
import { ensureSchema } from "@/lib/db/migrate";
import type { SharePolicy } from "@/lib/pump/share-rules";

/**
 * The split each launch was meant to have, written before it is signed
 *
 * The row is what the chain is checked against afterwards: the expected
 * value, never the proof. Without a database the policy lives only for the
 * request, which still covers the checks made during the launch itself
 */

export type PolicyState = "expected" | "submitted" | "verified" | "failed";

export async function savePolicy(mint: string, p: SharePolicy) {
  if (!sql) return;
  await ensureSchema();
  const dev = p.shareholders.find((s) => s.address === p.developer)!;
  const tre = p.shareholders.find((s) => s.address === p.treasury)!;
  await sql`
    insert into launch_fee_policies (mint, developer, treasury, developer_bps, treasury_bps)
    values (${mint}, ${p.developer}, ${p.treasury}, ${dev.shareBps}, ${tre.shareBps})
  `;
}

export async function markPolicy(
  mint: string,
  state: PolicyState,
  extra: { signature?: string; error?: string } = {},
) {
  if (!sql) return;
  await sql`
    update launch_fee_policies
       set state = ${state},
           signature = coalesce(${extra.signature ?? null}, signature),
           error = ${extra.error ?? null},
           verified_at = ${state === "verified" ? sql`now()` : sql`verified_at`}
     where mint = ${mint}
  `;
}

export async function getPolicy(mint: string): Promise<(SharePolicy & { state: PolicyState; signature: string | null }) | null> {
  if (!sql) return null;
  await ensureSchema();
  const [r] = await sql<Record<string, string | number | null>[]>`
    select * from launch_fee_policies where mint = ${mint}
  `;
  if (!r) return null;
  return {
    developer: r.developer as string,
    treasury: r.treasury as string,
    shareholders: [
      { address: r.developer as string, shareBps: Number(r.developer_bps) },
      { address: r.treasury as string, shareBps: Number(r.treasury_bps) },
    ],
    state: r.state as PolicyState,
    signature: (r.signature as string) ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Settings kept in the database                                       */
/* ------------------------------------------------------------------ */

export async function getSetting(key: string): Promise<string | null> {
  if (!sql) return null;
  await ensureSchema();
  const [r] = await sql<{ value: string }[]>`select value from app_settings where key = ${key}`;
  return r?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  if (!sql) throw new Error("Settings need DATABASE_URL");
  await ensureSchema();
  await sql`
    insert into app_settings (key, value) values (${key}, ${value})
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
}

/** The launch lookup table: LAUNCH_LOOKUP_TABLE on the host, or the one made from /admin */
export async function launchTableAddress(): Promise<string | null> {
  return process.env.LAUNCH_LOOKUP_TABLE?.trim() || (await getSetting("launch_lookup_table"));
}
