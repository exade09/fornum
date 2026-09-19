import { checkVerification, normalizePhone } from "@/lib/auth/verify";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const { phone, code } = (await request.json()) as {
    phone?: string;
    code?: string;
  };

  const normalized = normalizePhone(phone ?? "");
  if (!normalized || !code) {
    return Response.json({ error: "Enter the code from the message" }, { status: 400 });
  }

  const result = await checkVerification(normalized, code);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 401 });
  }

  const session = await createSession(result.phone);
  return Response.json({ masked: session.masked });
}
