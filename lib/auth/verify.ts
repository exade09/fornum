import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import { sql } from "@/lib/db/client";
import { hashPhone } from "@/lib/auth/session";
import { siteConfig } from "@/lib/config";
import { isConfigured as whatsappConfigured } from "@/lib/whatsapp/cloud";

/**
 * Proving a number is yours by writing from it
 *
 * Instead of sending a code out through a paid provider, the site hands the
 * visitor a code and a wa.me link to the Fornum number. They send it, the
 * WhatsApp webhook sees a message from that number carrying that code, and the
 * challenge is approved. WhatsApp has already checked who the sender is, so the
 * message itself is the proof, and an inbound message costs nothing.
 *
 * Two things tie it down:
 *
 * - the message has to come from the number typed on the site, so a code sent
 *   from somebody else's phone approves nothing
 * - only the browser that asked holds the secret that turns an approved
 *   challenge into a session, so a code read over a shoulder is useless
 *
 * Without a WhatsApp line configured, development approves a challenge on the
 * first check so the flow can be walked locally. Production refuses instead.
 */

/** Digits only, with a leading plus. Anything else is not a number we can dial */
export function normalizePhone(input: string) {
  const digits = input.replace(/[^\d]/g, "");
  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
}

/** Masked for display, the raw number never goes to the client */
export function maskPhone(phone: string) {
  const tail = phone.slice(-4);
  const head = phone.slice(0, Math.max(phone.length - 8, 3));
  return `${head} ••• ${tail}`;
}

export function isConfigured() {
  return whatsappConfigured();
}

/** Local walkthrough without a line, never in production */
export function isStub() {
  return !isConfigured() && process.env.NODE_ENV !== "production";
}

const TTL_MINUTES = 10;

/** No 0/O, 1/I/L, so a code read off a screen is typed back right */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function newCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
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

/**
 * Pulls a code out of what the visitor sent
 *
 * Only the prefilled form or a message that is the code and nothing else. A
 * launch message is full of six letter words, and any of them would otherwise
 * read as a code
 */
export function codeIn(text: string) {
  const upper = text.trim().toUpperCase();
  const pattern = `[${ALPHABET}]{${CODE_LENGTH}}`;
  const labelled = upper.match(new RegExp(`FORNUM,?\\s+CODE\\s+(${pattern})\\b`));
  if (labelled) return labelled[1];
  return new RegExp(`^${pattern}$`).test(upper) ? upper : null;
}

type Challenge = {
  id: string;
  code: string;
  phoneHash: string;
  phoneMasked: string;
  browserHash: string;
  status: "pending" | "approved";
  expiresAt: number;
};

declare global {
  // the webhook and the sign in routes can be separate module graphs in dev
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
  const expiresAt = Date.now() + TTL_MINUTES * 60_000;

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

export type Approval =
  | { ok: true }
  | { ok: false; reason: "no-code" | "unknown" | "wrong-number" };

/**
 * Called by the webhook for every inbound text
 *
 * A message without a code is an ordinary message for the operator and is
 * left alone. A code from a number other than the one typed on the site
 * approves nothing
 */
export async function approveFromMessage(
  fromPhone: string,
  text: string,
): Promise<Approval> {
  const code = codeIn(text);
  if (!code) return { ok: false, reason: "no-code" };

  const fromHash = hashPhone(fromPhone);

  if (!sql) {
    sweepMemory();
    const c = [...memory.values()].find((x) => x.code === code);
    if (!c) return { ok: false, reason: "unknown" };
    if (c.phoneHash !== fromHash) return { ok: false, reason: "wrong-number" };
    c.status = "approved";
    return { ok: true };
  }

  const [row] = await sql<{ phone_hash: string }[]>`
    select phone_hash from login_challenges
     where code = ${code} and expires_at > now()
  `;
  if (!row) return { ok: false, reason: "unknown" };
  if (row.phone_hash !== fromHash) return { ok: false, reason: "wrong-number" };

  await sql`
    update login_challenges set status = 'approved'
     where code = ${code} and phone_hash = ${fromHash}
  `;
  return { ok: true };
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
    if (c.status !== "approved" && isStub()) c.status = "approved";
    if (c.status !== "approved") return { status: "pending" };
    memory.delete(id);
    return { status: "approved", phoneHash: c.phoneHash, phoneMasked: c.phoneMasked };
  }

  if (isStub()) {
    await sql`
      update login_challenges set status = 'approved'
       where id = ${id} and browser_hash = ${browserHash}
    `;
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
