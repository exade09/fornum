import { refuseUnlessAdmin } from "@/lib/auth/admin";
import { buybackConfig } from "@/lib/buyback/config";
import { connect } from "@/lib/solana/read";
import { createLaunchTable, verifiedLaunchTable } from "@/lib/pump/shares";
import { launchTableAddress, setSetting } from "@/lib/pump/policies";

/**
 * Creates the launch lookup table, once, from /admin
 *
 * Its own transaction, paid and owned by the treasury, waited on until it is
 * final. The address is kept in the database, and checked again before every
 * launch: authority, active, every shared account in it
 */
export const maxDuration = 60;

export async function POST(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;

  const { settings, treasuryKey } = buybackConfig();
  if (!settings.treasuryWallet || !treasuryKey) {
    return Response.json(
      { error: "Set TREASURY_WALLET and TREASURY_SECRET first: the treasury owns the table" },
      { status: 503 },
    );
  }
  const connection = connect();
  const existing = await launchTableAddress();
  if (existing) {
    try {
      await verifiedLaunchTable(connection, existing, treasuryKey.publicKey);
      return Response.json({ table: existing, note: "The table is already there and checks out" });
    } catch {
      // not usable, make a new one
    }
  }
  try {
    const { table, signature } = await createLaunchTable(connection, treasuryKey);
    await setSetting("launch_lookup_table", table);
    return Response.json({ table, signature });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }
}
