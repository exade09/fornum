import postgres from "postgres";

/**
 * One Postgres connection, or none
 *
 * With DATABASE_URL unset the whole app falls back to an in memory store, so
 * the site runs and every page renders before a database exists. Nothing in the
 * codebase branches on this except lib/db/store.ts
 */

declare global {
  // reuse the connection across hot reloads in dev
  var __fornumSql: ReturnType<typeof postgres> | undefined;
}

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  return postgres(url, {
    // poolers in front of Postgres do not support prepared statements
    prepare: false,
    max: 5,
    idle_timeout: 20,
  });
}

export const sql = globalThis.__fornumSql ?? create();

if (process.env.NODE_ENV !== "production") {
  globalThis.__fornumSql = sql ?? undefined;
}

export const hasDatabase = sql !== null;
