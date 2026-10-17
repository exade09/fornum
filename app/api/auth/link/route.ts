import { redeemLink } from "@/lib/auth/sign-in-links";
import { createSession } from "@/lib/auth/session";
import { getWallet } from "@/lib/db/store";

/** Pressed on the page a sign in link opens, uses the link up */
export async function POST(request: Request) {
  const { token } = (await request.json()) as { token?: string };
  const redeemed = token ? await redeemLink(token) : null;

  if (!redeemed) {
    return Response.json(
      { error: "This link has expired or was already used. Ask for a new one in the chat" },
      { status: 410 },
    );
  }

  const session = await createSession(redeemed.phoneHash, redeemed.phoneMasked);
  return Response.json({
    masked: session.masked,
    wallet: await getWallet(session.sub),
  });
}
