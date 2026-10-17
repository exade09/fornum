import { createHash, randomBytes } from "node:crypto";
import { sql } from "@/lib/db/client";
import "server-only";

/**
 * One time sign in links, pasted into the WhatsApp thread by the operator
 *
 * The thread already proves who is on the other end: the operator only ever
 * replies to the number that wrote. So a link sent there can stand in for a
 * code. It goes out with the mint address after a launch, or on its own when
 * somebody writes asking to sign in.
 *
 * Only the hash of the token is stored, a link works once and for a week, and
 * opening it does nothing until the visitor presses the button on the page,
 * because WhatsApp fetches every link to draw its preview
 */

const TTL_DAYS = 7;

type Link = {
  phoneHash: string;
  phoneMasked: string;
  expiresAt: number;
};

declare global {
  var __fornumSignInLinks: Map<string, Link> | undefined;
}

const memory = (globalThis.__fornumSignInLinks ??= new Map<string, Link>());

function sha(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** A fresh link for a number, as the path to append to the site's origin */
export async function issueLink(phoneHash: string, phoneMasked: string) {
  const token = randomBytes(18).toString("base64url");
  const expiresAt = Date.now() + TTL_DAYS * 86_400_000;

  if (!sql) {
    memory.set(sha(token), { phoneHash, phoneMasked, expiresAt });
  } else {
    await sql`delete from sign_in_links where expires_at < now()`;
    await sql`
      insert into sign_in_links (token_hash, phone_hash, phone_masked, expires_at)
      values (${sha(token)}, ${phoneHash}, ${phoneMasked}, ${new Date(expiresAt)})
    `;
  }

  return `/s/${token}`;
}

/** Who a link is for, without using it up. For the page that shows the button */
export async function peekLink(token: string): Promise<{ masked: string } | null> {
  if (!sql) {
    const link = memory.get(sha(token));
    return link && link.expiresAt > Date.now() ? { masked: link.phoneMasked } : null;
  }

  const [row] = await sql<{ phone_masked: string }[]>`
    select phone_masked from sign_in_links
     where token_hash = ${sha(token)} and expires_at > now()
  `;
  return row ? { masked: row.phone_masked } : null;
}

/** Uses the link up and says whose it was */
export async function redeemLink(
  token: string,
): Promise<{ phoneHash: string; phoneMasked: string } | null> {
  if (!sql) {
    const key = sha(token);
    const link = memory.get(key);
    memory.delete(key);
    return link && link.expiresAt > Date.now()
      ? { phoneHash: link.phoneHash, phoneMasked: link.phoneMasked }
      : null;
  }

  // deleted and returned in one statement, so two presses cannot both win
  const [row] = await sql<{ phone_hash: string; phone_masked: string }[]>`
    delete from sign_in_links
     where token_hash = ${sha(token)} and expires_at > now()
    returning phone_hash, phone_masked
  `;
  return row ? { phoneHash: row.phone_hash, phoneMasked: row.phone_masked } : null;
}
