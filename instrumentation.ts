/**
 * Runs once when a server instance starts
 *
 * Makes sure the database has every table and column the code uses, so a
 * deploy never depends on somebody remembering to run the files in db/ by
 * hand. A database that cannot be reached is logged, not fatal: pages fall
 * back as they always have, and /admin shows the error
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureSchema } = await import("@/lib/db/migrate");
  try {
    await ensureSchema();
  } catch (err) {
    console.error("[db] schema check failed", err);
  }
  // the buyback settings are checked once at start, so a bad value shows in
  // the logs right away and not first at the next claim
  const { buybackConfig } = await import("@/lib/buyback/config");
  const { settings, problems } = buybackConfig();
  if (problems.length > 0 && (settings.enabled || settings.treasuryWallet)) {
    console.error("[buyback] settings:", problems.join("; "));
  }
}
