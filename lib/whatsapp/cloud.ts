import { createHmac, timingSafeEqual } from "node:crypto";
import "server-only";

/**
 * The Fornum number on the WhatsApp Cloud API, straight from Meta
 *
 * Only what sign in needs: check that a webhook really came from Meta, pull the
 * text messages out of it, and send a short reply inside the conversation the
 * visitor just opened. Replies inside that window are free, so nothing about
 * signing in is billed per message
 *
 * The number can stay in the WhatsApp Business app at the same time, through
 * Meta's coexistence onboarding, so the operator keeps answering launches from
 * the phone as before
 */

const APP_SECRET = process.env.WHATSAPP_APP_SECRET;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? "v23.0";

/** Enough to receive messages, which is all sign in strictly needs */
export function isConfigured() {
  return Boolean(APP_SECRET && VERIFY_TOKEN);
}

/** The handshake Meta does once when the webhook URL is saved */
export function verifySubscription(params: URLSearchParams) {
  return params.get("hub.mode") === "subscribe" &&
    VERIFY_TOKEN &&
    params.get("hub.verify_token") === VERIFY_TOKEN
    ? params.get("hub.challenge")
    : null;
}

/**
 * Meta signs every delivery with the app secret
 *
 * Without this anybody could post a made up message from any number to the
 * webhook and sign in as them
 */
export function isAuthentic(rawBody: string, header: string | null) {
  if (!APP_SECRET || !header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
  const given = header.slice("sha256=".length);
  return (
    given.length === expected.length &&
    timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  );
}

export type InboundText = { from: string; text: string };

type WebhookBody = {
  entry?: {
    changes?: {
      value?: {
        messages?: { from?: string; type?: string; text?: { body?: string } }[];
      };
    }[];
  }[];
};

/** Every text message in a delivery, sender as digits without the plus */
export function textMessages(body: WebhookBody): InboundText[] {
  const out: InboundText[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const m of change.value?.messages ?? []) {
        if (m.type === "text" && m.from && m.text?.body) {
          out.push({ from: m.from, text: m.text.body });
        }
      }
    }
  }
  return out;
}

/** A reply in the thread, skipped quietly when no token is set */
export async function reply(to: string, text: string) {
  if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) return;

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    },
  );

  if (!res.ok) {
    console.error("[whatsapp] reply failed", res.status, (await res.text()).slice(0, 200));
  }
}
