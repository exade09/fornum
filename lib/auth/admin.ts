import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import "server-only";

/**
 * Who may use /admin and the operator routes
 *
 * The operator signs in with a password once and gets a signed, httpOnly
 * cookie, so nothing secret sits in the page or in localStorage any more. The
 * password itself is never stored: ADMIN_PASSWORD_HASH holds a scrypt hash of
 * it, made with `node scripts/admin-password.mts`.
 *
 * ADMIN_TOKEN still works as a bearer token, for scripts and curl
 */

const COOKIE = "fornum_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  return process.env.AUTH_SECRET ?? "fornum-dev-secret-not-for-production";
}

function sign(payload: string) {
  return createHmac("sha256", `${secret()}:admin`).update(payload).digest("base64url");
}

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Null when sign in is possible, otherwise why it is not */
export function adminSetupProblem(): string | null {
  return process.env.ADMIN_PASSWORD_HASH ? null : "ADMIN_PASSWORD_HASH is not set on this deployment";
}

/**
 * Checks a password against ADMIN_PASSWORD_HASH
 *
 * The hash is `scrypt:<salt>:<key>`, both base64url, which is what the script
 * writes. Colons rather than dollar signs, because .env files expand `$`.
 * Anything else is refused rather than guessed at
 */
export function passwordMatches(password: string) {
  // hosts' env screens make it easy to paste a value with quotes around it
  const stored = process.env.ADMIN_PASSWORD_HASH?.trim().replace(/^(["'])(.*)\1$/, "$2").trim();
  if (!stored) return false;

  const [scheme, salt, key] = stored.split(/[:$]/);
  if (scheme === "scrypt" && salt && key) {
    const expected = Buffer.from(key, "base64url");
    const actual = scryptSync(password, Buffer.from(salt, "base64url"), expected.length);
    return timingSafeEqual(actual, expected);
  }

  // not a hash at all: the password itself was pasted in. Still works, and
  // compared in constant time, but the hash from the script is the better way
  console.warn("[admin] ADMIN_PASSWORD_HASH holds a plain password, not a scrypt hash");
  const digest = (v: string) => createHmac("sha256", "fornum-admin-compare").update(v).digest();
  return timingSafeEqual(digest(password), digest(stored));
}

export async function startAdminSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}

/** True when this request carries a valid operator cookie */
export async function isAdmin() {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [payload, mac] = raw.split(".");
  if (!payload || !mac || !same(sign(payload), mac)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * Guards every operator route
 *
 * Null when the request may go on, otherwise the response to send back. The
 * cookie from the password sign in is the normal way in; a bearer token equal
 * to ADMIN_TOKEN is accepted too, so scripts keep working
 */
export async function refuseUnlessAdmin(request: Request): Promise<Response | null> {
  if (await isAdmin()) return null;

  const token = process.env.ADMIN_TOKEN;
  const header = request.headers.get("authorization");
  if (token && header && same(header, `Bearer ${token}`)) return null;

  return Response.json({ error: "Sign in to the admin first" }, { status: 401 });
}
