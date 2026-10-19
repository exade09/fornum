import { refuseUnlessAdmin } from "@/lib/auth/admin";
import { setSetting } from "@/lib/settings";

/**
 * Sets the CA text in the site header, any text, or clears it with an empty
 * value. Every page reads it per request, so it shows straight away
 */
export async function POST(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;

  const body = (await request.json().catch(() => ({}))) as { ca?: string };
  // any text: an address, or a word like "soon"; only kept to a sane length
  const ca = (body.ca ?? "").trim().slice(0, 200);
  try {
    await setSetting("contract_address", ca || null);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Could not save it" }, { status: 503 });
  }
  return Response.json({ ca: ca || null });
}
