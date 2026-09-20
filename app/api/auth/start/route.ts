import { normalizePhone, startVerification, type Channel } from "@/lib/auth/verify";
import { allowVerification, callerAddress } from "@/lib/auth/rate-limit";
import { hashPhone } from "@/lib/auth/session";

export async function POST(request: Request) {
  const { phone, channel } = (await request.json()) as {
    phone?: string;
    channel?: Channel;
  };

  const normalized = normalizePhone(phone ?? "");
  if (!normalized) {
    return Response.json({ error: "Enter a full number with country code" }, { status: 400 });
  }

  // before anything is sent, because sending is what costs money
  const allowed = await allowVerification(
    hashPhone(normalized),
    callerAddress(request),
  );
  if (!allowed.ok) {
    return Response.json({ error: allowed.error }, { status: 429 });
  }

  const result = await startVerification(
    normalized,
    channel === "sms" ? "sms" : "whatsapp",
  );

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 502 });
  }

  return Response.json({ channel: result.channel, stub: result.stub });
}
