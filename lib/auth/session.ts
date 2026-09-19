import { createHmac, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { maskPhone } from "@/lib/auth/verify";

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

export async function createSession(phone: string) {
  const session: Session = {
    sub: hashPhone(phone),
    masked: maskPhone(phone),
    at: Date.now(),
  };

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
  return raw ? decode(raw) : null;
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
