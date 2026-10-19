import { refuseUnlessAdmin } from "@/lib/auth/admin";
import { isValidAddress } from "@/lib/solana/wallet";
import { setSetting } from "@/lib/settings";

/**
 * Sets the contract address in the site header, or clears it with an empty
 * value. Every page reads it per request, so it shows straight away
 */
export async function POST(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;

  const body = (await request.json().catch(() => ({}))) as { ca?: string };
  const ca = (body.ca ?? "").trim();
  if (ca && !isValidAddress(ca)) {
    return Response.json({ error: "That is not a Solana address" }, { status: 400 });
  }
  try {
    await setSetting("contract_address", ca || null);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Could not save it" }, { status: 503 });
  }
  return Response.json({ ca: ca || null });
}
