/**
 * Phone verification behind one interface, so the provider can change without
 * touching the routes or the form
 *
 * Twilio Verify is the default because a single call covers both channels: it
 * sends the code over WhatsApp when the number is reachable there and over SMS
 * otherwise, and it ships its own Meta approved authentication templates, so
 * there is no template review to sit through
 *
 * With no credentials configured it falls back to a local stub, which lets the
 * flow be exercised end to end before an account exists
 */

export type Channel = "sms" | "whatsapp";

export type StartResult =
  { ok: true; channel: Channel; stub: boolean } | { ok: false; error: string };

export type CheckResult =
  { ok: true; phone: string } | { ok: false; error: string };

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

/** An API key, which unlike the account token can be revoked on its own */
const API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;

const hasCredentials = Boolean(
  (API_KEY_SID && API_KEY_SECRET) || (ACCOUNT_SID && AUTH_TOKEN),
);

export function isConfigured() {
  return Boolean(hasCredentials && SERVICE_SID);
}

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

/**
 * Prefer the API key when one is set
 *
 * Both authenticate the same way, but a key can be revoked without taking the
 * rest of the account with it, so the account token is only the fallback for
 * before a key exists
 */
function twilioAuthHeader() {
  const [user, secret] =
    API_KEY_SID && API_KEY_SECRET
      ? [API_KEY_SID, API_KEY_SECRET]
      : [ACCOUNT_SID, AUTH_TOKEN];
  return `Basic ${Buffer.from(`${user}:${secret}`).toString("base64")}`;
}

export async function startVerification(
  phone: string,
  channel: Channel = "whatsapp",
): Promise<StartResult> {
  if (!isConfigured()) {
    // no account yet: pretend it was sent, the stub code is checked below
    console.info(`[verify] stub code for ${phone} is ${STUB_CODE}`);
    return { ok: true, channel, stub: true };
  }

  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${SERVICE_SID}/Verifications`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, Channel: channel }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    return {
      ok: false,
      error: `Provider rejected the request: ${body.slice(0, 200)}`,
    };
  }

  return { ok: true, channel, stub: false };
}

/** Code accepted while no provider is configured */
const STUB_CODE = "000000";

export async function checkVerification(
  phone: string,
  code: string,
): Promise<CheckResult> {
  if (!isConfigured()) {
    return code === STUB_CODE
      ? { ok: true, phone }
      : { ok: false, error: "Wrong code" };
  }

  const res = await fetch(
    `https://verify.twilio.com/v2/Services/${SERVICE_SID}/VerificationCheck`,
    {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: phone, Code: code }),
    },
  );

  if (!res.ok) {
    return { ok: false, error: "Wrong code" };
  }

  const data = (await res.json()) as { status?: string };
  return data.status === "approved"
    ? { ok: true, phone }
    : { ok: false, error: "Wrong code" };
}
