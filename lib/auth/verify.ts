import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { sql } from "@/lib/db/client";
import { siteConfig } from "@/lib/config";

/**
 * Proving a number is yours by writing from it
 *
 * The site hands the visitor a code and a wa.me link to the Fornum number.
 * They send it, the operator sees it arrive in the WhatsApp Business app like
 * any launch, and confirms it in /admin by typing the number it came from.
 * WhatsApp has already checked who the sender is, so the message is the proof,
 * and nothing here talks to WhatsApp or to any paid provider.
 *
 * Two things tie it down:
 *
 * - the confirmation carries the sender's number, and it has to hash to the
 *   number typed on the site, so a code sent from somebody else's phone
 *   approves nothing
 * - only the browser that asked holds the secret that turns an approved
 *   challenge into a session, so a code read over a shoulder is useless
 *
 * A person confirms, so a challenge lives for a day rather than minutes, and
 * the sign in page picks up where it left off when the visitor comes back
 */

/** Digits only, with a leading plus. Anything else is not a number we can dial */
export function normalizePhone(input: string) {
  const digits = input.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
}

/** Masked for display, the raw number never goes to the client */
export function maskPhone(phone: string) {
  // the country code and one digit, then only the last two
  const tail = phone.slice(-2);
  const head = phone.slice(0, Math.max(phone.length - 8, 3));
  return `${head} ••• ${tail}`;
}

/**
 * Masks written before the tail was cut to two digits showed four. Anything
 * shown goes through this, so old rows and old cookies read the same as new
 */
export function tightenMask(masked: string) {
  return masked.replace(/ ••• \d*(\d\d)$/, " ••• $1");
}

const TTL_HOURS = 24;

/** No 0/O, 1/I/L, so a code read off a screen is typed back right */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function newCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** What the operator types back, forgiving about case and stray spaces */
export function cleanCode(input: string) {
  const code = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return code.length === CODE_LENGTH ? code : null;
}

function sha(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** What the visitor sends, prefilled into the chat */
export function messageFor(code: string) {
  return `Sign in to Fornum, code ${code}`;
}

export function chatLink(code: string) {
  return `https://wa.me/${siteConfig.whatsapp.e164}?text=${encodeURIComponent(messageFor(code))}`;
}

type Challenge = {
  id: string;
  code: string;
  phoneHash: string;
  phoneMasked: string;
  browserHash: string;
  status: "pending" | "approved";
  expiresAt: number;
  createdAt: number;
};

declare global {
  // pages, route handlers and the admin desk can be separate module graphs in
  // dev, so without a database they all have to read the same map
  var __fornumChallenges: Map<string, Challenge> | undefined;
}

const memory = (globalThis.__fornumChallenges ??= new Map<string, Challenge>());

function sweepMemory() {
  const now = Date.now();
  for (const [id, c] of memory) if (c.expiresAt < now) memory.delete(id);
}

export type StartedChallenge = {
  id: string;
  code: string;
  /** goes into the browser cookie, never stored as is */
  secret: string;
  expiresAt: number;
};

export async function startChallenge(
  phoneHash: string,
  phoneMasked: string,
): Promise<StartedChallenge> {
  const id = randomUUID();
  const secret = randomBytes(24).toString("base64url");
  const expiresAt = Date.now() + TTL_HOURS * 3_600_000;

  if (!sql) {
    sweepMemory();
    let code = newCode();
    while ([...memory.values()].some((c) => c.code === code)) code = newCode();
    memory.set(id, {
      id,
      code,
      phoneHash,
      phoneMasked,
      browserHash: sha(secret),
      status: "pending",
      expiresAt,
      createdAt: Date.now(),
    });
    return { id, code, secret, expiresAt };
  }

  await sql`delete from login_challenges where expires_at < now()`;

  // a clash on the code is rare enough that a couple of retries settle it
  for (let attempt = 0; ; attempt++) {
    const code = newCode();
    try {
      await sql`
        insert into login_challenges
          (id, code, phone_hash, phone_masked, browser_hash, expires_at)
        values
          (${id}, ${code}, ${phoneHash}, ${phoneMasked}, ${sha(secret)},
           ${new Date(expiresAt)})
      `;
      return { id, code, secret, expiresAt };
    } catch (err) {
      if (attempt >= 3) throw err;
    }
  }
}

export type PendingSignIn = { code: string; masked: string; createdAt: string };

/** What is waiting for the operator, newest first */
export async function listPending(): Promise<PendingSignIn[]> {
  if (!sql) {
    sweepMemory();
    return [...memory.values()]
      .filter((c) => c.status === "pending")
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((c) => ({
        code: c.code,
        masked: c.phoneMasked,
        createdAt: new Date(c.createdAt).toISOString(),
      }));
  }

  const rows = await sql<{ code: string; phone_masked: string; created_at: Date }[]>`
    select code, phone_masked, created_at from login_challenges
     where status = 'pending' and expires_at > now()
     order by created_at desc
     limit 100
  `;
  return rows.map((r) => ({
    code: r.code,
    masked: r.phone_masked,
    createdAt: r.created_at.toISOString(),
  }));
}

export type Approval =
  | { ok: true; masked: string }
  | { ok: false; reason: "unknown" | "wrong-number" };

/**
 * The operator confirms a code they saw arrive, with the number it came from
 *
 * The number is hashed and compared, never stored, and a mismatch approves
 * nothing: the code was asked for with one number and sent from another
 */
export async function approveCode(
  code: string,
  senderPhoneHash: string,
): Promise<Approval> {
  if (!sql) {
    sweepMemory();
    const c = [...memory.values()].find((x) => x.code === code);
    if (!c) return { ok: false, reason: "unknown" };
    if (c.phoneHash !== senderPhoneHash) return { ok: false, reason: "wrong-number" };
    c.status = "approved";
    return { ok: true, masked: c.phoneMasked };
  }

  const [row] = await sql<{ phone_hash: string; phone_masked: string }[]>`
    select phone_hash, phone_masked from login_challenges
     where code = ${code} and expires_at > now()
  `;
  if (!row) return { ok: false, reason: "unknown" };
  if (row.phone_hash !== senderPhoneHash) return { ok: false, reason: "wrong-number" };

  await sql`
    update login_challenges set status = 'approved'
     where code = ${code} and phone_hash = ${senderPhoneHash}
  `;
  return { ok: true, masked: row.phone_masked };
}

/**
 * The code of a challenge this browser started and is still waiting on
 *
 * Lets the sign in page show the same code again after the visitor closed the
 * tab, since a person may take a while to confirm it
 */
export async function peekChallenge(
  id: string,
  secret: string,
): Promise<{ code: string; masked: string } | null> {
  const browserHash = sha(secret);

  if (!sql) {
    sweepMemory();
    const c = memory.get(id);
    return c && c.browserHash === browserHash && c.status === "pending"
      ? { code: c.code, masked: c.phoneMasked }
      : null;
  }

  const [row] = await sql<{ code: string; phone_masked: string }[]>`
    select code, phone_masked from login_challenges
     where id = ${id} and browser_hash = ${browserHash}
       and status = 'pending' and expires_at > now()
  `;
  return row ? { code: row.code, masked: row.phone_masked } : null;
}

export type Redeemed =
  | { status: "approved"; phoneHash: string; phoneMasked: string }
  | { status: "pending" }
  | { status: "gone" };

/**
 * Turns an approved challenge into a session, once
 *
 * The browser proves it is the one that asked with the secret from its
 * cookie. The row is deleted on success so the same approval cannot sign in
 * twice
 */
export async function redeemChallenge(
  id: string,
  secret: string,
): Promise<Redeemed> {
  const browserHash = sha(secret);

  if (!sql) {
    sweepMemory();
    const c = memory.get(id);
    if (!c || c.browserHash !== browserHash) return { status: "gone" };
    if (c.status !== "approved") return { status: "pending" };
    memory.delete(id);
    return { status: "approved", phoneHash: c.phoneHash, phoneMasked: c.phoneMasked };
  }

  const [row] = await sql<
    { status: string; phone_hash: string; phone_masked: string }[]
  >`
    select status, phone_hash, phone_masked from login_challenges
     where id = ${id} and browser_hash = ${browserHash} and expires_at > now()
  `;
  if (!row) return { status: "gone" };
  if (row.status !== "approved") return { status: "pending" };

  const deleted = await sql`
    delete from login_challenges
     where id = ${id} and status = 'approved'
    returning id
  `;
  // a parallel poll got here first
  if (deleted.length === 0) return { status: "gone" };

  return {
    status: "approved",
    phoneHash: row.phone_hash,
    phoneMasked: row.phone_masked,
  };
}
