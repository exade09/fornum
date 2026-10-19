import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The session is a signed cookie holding the salted hash of the number and a
 * masked copy for display. The raw number is never stored here, which matches
 * what the product promises everywhere else on the site
 *
 * When the database lands this becomes a row lookup, the shape of Session does
 * not have to change
 */

const COOKIE = "fornum_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  return process.env.AUTH_SECRET ?? "fornum-dev-secret-not-for-production";
}

export function hashPhone(phone: string) {
  return createHash("sha256")
    .update(`${secret()}:${phone}`)
    .digest("hex")
    .slice(0, 32);
}

export type Session = { sub: string; masked: string; at: number };

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function encode(session: Session) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(raw: string): Session | null {
  const [payload, mac] = raw.split(".");
  if (!payload || !mac) return null;

  const expected = sign(payload);
  // both sides are base64url of the same length, so a constant time compare is safe
  if (
    expected.length !== mac.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(mac))
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
  } catch {
    return null;
  }
}

/**
 * Starts a session for a number already proven to be the visitor's
 *
 * Takes the hash and the masked copy rather than the number, because by the
 * time a challenge is approved the number in the clear is long gone
 */
export async function createSession(sub: string, masked: string) {
  const session: Session = { sub, masked, at: Date.now() };

  (await cookies()).set(COOKIE, encode(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });

  return session;
}

export async function readSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  const session = raw ? decode(raw) : null;
  // sessions started before masks showed two digits still carry four
  return session ? { ...session, masked: session.masked.replace(/ ••• \d*(\d\d)$/, " ••• $1") } : null;
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
