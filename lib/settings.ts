import "server-only";
import { sql } from "@/lib/db/client";
import { ensureSchema } from "@/lib/db/migrate";

/**
 * Small values changed from /admin without a deploy, kept in app_settings
 *
 * Reads never throw: a missing database or table reads as unset, so a page
 * that shows a setting cannot be taken down by it
 */

export async function getSetting(key: string): Promise<string | null> {
  if (!sql) return null;
  try {
    await ensureSchema();
    const [r] = await sql<{ value: string }[]>`select value from app_settings where key = ${key}`;
    return r?.value ?? null;
  } catch (err) {
    console.error("[settings] read failed", key, err);
    return null;
  }
}

export async function setSetting(key: string, value: string | null) {
  if (!sql) throw new Error("Settings need DATABASE_URL");
  await ensureSchema();
  if (value === null) {
    await sql`delete from app_settings where key = ${key}`;
    return;
  }
  await sql`
    insert into app_settings (key, value) values (${key}, ${value})
    on conflict (key) do update set value = excluded.value, updated_at = now()
  `;
}

/** The Fornum token's contract address shown in the header, CONTRACT_ADDRESS when the database has none */
export async function contractAddress(): Promise<string | null> {
  return (await getSetting("contract_address")) ?? (process.env.CONTRACT_ADDRESS?.trim() || null);
}
