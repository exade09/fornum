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
  | { ok: true; channel: Channel; stub: boolean }
  | { ok: false; error: string };

export type CheckResult =
  | { ok: true; phone: string }
  | { ok: false; error: string };

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

export function isConfigured() {
  return Boolean(ACCOUNT_SID && AUTH_TOKEN && SERVICE_SID);
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

function twilioAuthHeader() {
  return `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64")}`;
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
    return { ok: false, error: `Provider rejected the request: ${body.slice(0, 200)}` };
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
