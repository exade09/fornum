import { cookies } from "next/headers";
import { redeemChallenge } from "@/lib/auth/verify";
import { createSession } from "@/lib/auth/session";
import { CHALLENGE_COOKIE } from "@/lib/auth/challenge-cookie";
import { getWallet } from "@/lib/db/store";

/**
 * Polled by the sign in page while the visitor sends the code
 *
 * 202 while the message has not arrived, 200 with a session once it has, 410
 * when the challenge expired or belongs to another browser
 */
export async function POST() {
  const jar = await cookies();
  const raw = jar.get(CHALLENGE_COOKIE)?.value ?? "";
  const [id, secret] = raw.split(".");

  if (!id || !secret) {
    return Response.json({ error: "Start again, the code has expired" }, { status: 410 });
  }

  const result = await redeemChallenge(id, secret);

  if (result.status === "pending") {
    return Response.json({ pending: true }, { status: 202 });
  }

  jar.delete(CHALLENGE_COOKIE);

  if (result.status === "gone") {
    return Response.json({ error: "Start again, the code has expired" }, { status: 410 });
  }

  const session = await createSession(result.phoneHash, result.phoneMasked);
  return Response.json({
    masked: session.masked,
    wallet: await getWallet(session.sub),
  });
}
