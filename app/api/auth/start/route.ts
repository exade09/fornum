import { normalizePhone, startVerification, type Channel } from "@/lib/auth/verify";

export async function POST(request: Request) {
  const { phone, channel } = (await request.json()) as {
    phone?: string;
    channel?: Channel;
  };

  const normalized = normalizePhone(phone ?? "");
  if (!normalized) {
    return Response.json({ error: "Enter a full number with country code" }, { status: 400 });
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
