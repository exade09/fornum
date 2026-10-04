import { approveFromMessage, normalizePhone } from "@/lib/auth/verify";
import {
  isAuthentic,
  reply,
  textMessages,
  verifySubscription,
} from "@/lib/whatsapp/cloud";

/** Meta calls this once, when the webhook URL is saved in the app dashboard */
export async function GET(request: Request) {
  const challenge = verifySubscription(new URL(request.url).searchParams);
  return challenge
    ? new Response(challenge, { status: 200 })
    : new Response("Forbidden", { status: 403 });
}

/**
 * Every message to the Fornum number lands here
 *
 * A message carrying a sign in code approves that challenge. Everything else
 * is a launch or a question for the operator, who reads it in the app, so it
 * is left alone. Meta retries anything that is not a 200, so once the
 * signature checks out the answer is always 200
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!isAuthentic(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("Bad signature", { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("ok");
  }

  for (const message of textMessages(body as Parameters<typeof textMessages>[0])) {
    const phone = normalizePhone(message.from);
    if (!phone) continue;

    try {
      const result = await approveFromMessage(phone, message.text);
      if (result.ok) {
        await reply(
          message.from,
          "You are signed in to Fornum. If that was not you, write here right away and we will sort it out",
        );
      } else if (result.reason === "wrong-number") {
        await reply(
          message.from,
          "That code was asked for with another number. Sign in on the site with this number to get your own",
        );
      } else if (result.reason === "unknown") {
        await reply(
          message.from,
          "That code has expired. Ask for a new one on the sign in page",
        );
      }
    } catch (err) {
      console.error("[whatsapp] webhook", err instanceof Error ? err.message : err);
    }
  }

  return new Response("ok");
}
