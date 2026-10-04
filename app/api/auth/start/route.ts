import { cookies } from "next/headers";
import {
  chatLink,
  isConfigured,
  isStub,
  maskPhone,
  messageFor,
  normalizePhone,
  startChallenge,
} from "@/lib/auth/verify";
import { allowVerification, callerAddress } from "@/lib/auth/rate-limit";
import { hashPhone } from "@/lib/auth/session";
import { CHALLENGE_COOKIE } from "@/lib/auth/challenge-cookie";

/**
 * Hands the visitor a code to send from the number they typed
 *
 * Nothing goes out from here. The secret that will redeem the challenge is
 * kept in an httpOnly cookie, the code and the chat link go back to the page
 */
export async function POST(request: Request) {
  if (!isConfigured() && !isStub()) {
    return Response.json(
      { error: "Sign in is not connected on this deployment yet" },
      { status: 503 },
    );
  }

  const { phone } = (await request.json()) as { phone?: string };

  const normalized = normalizePhone(phone ?? "");
  if (!normalized) {
    return Response.json({ error: "Enter a full number with country code" }, { status: 400 });
  }

  const phoneHash = hashPhone(normalized);
  const allowed = await allowVerification(phoneHash, callerAddress(request));
  if (!allowed.ok) {
    return Response.json({ error: allowed.error }, { status: 429 });
  }

  const challenge = await startChallenge(phoneHash, maskPhone(normalized));

  (await cookies()).set(CHALLENGE_COOKIE, `${challenge.id}.${challenge.secret}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(challenge.expiresAt),
  });

  return Response.json({
    code: challenge.code,
    message: messageFor(challenge.code),
    link: chatLink(challenge.code),
    expiresAt: challenge.expiresAt,
    stub: isStub(),
  });
}
