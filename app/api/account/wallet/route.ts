import { readSession } from "@/lib/auth/session";
import { getWallet, setWallet } from "@/lib/db/store";
import { isValidAddress } from "@/lib/solana/wallet";

/** The wallet the signed in number sends its fees to */
export async function GET() {
  const session = await readSession();
  if (!session) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }
  return Response.json({ wallet: await getWallet(session.sub) });
}

/**
 * Links a wallet to the number
 *
 * No signature is asked for: a payout to an address the visitor does not
 * control only hurts the visitor, and the number has already been proven
 */
export async function POST(request: Request) {
  const session = await readSession();
  if (!session) {
    return Response.json({ error: "Sign in first" }, { status: 401 });
  }

  const { wallet } = (await request.json()) as { wallet?: string };
  const address = wallet?.trim() ?? "";
  if (!isValidAddress(address)) {
    return Response.json({ error: "That is not a Solana address" }, { status: 400 });
  }

  await setWallet(session.sub, address);
  return Response.json({ wallet: address });
}
