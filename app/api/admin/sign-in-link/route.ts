import { refuseUnlessAdmin } from "@/lib/auth/admin";
import { issueLink } from "@/lib/auth/sign-in-links";
import { maskPhone, normalizePhone } from "@/lib/auth/verify";
import { hashPhone } from "@/lib/auth/session";
import { signInReply } from "@/lib/replies";

/**
 * A sign in link for somebody who wrote to the number asking for one
 *
 * Only ever paste it into the thread of the number it was made for: whoever
 * opens it is signed in as that number
 */
export async function POST(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;

  const { phone } = (await request.json()) as { phone?: string };
  const normalized = normalizePhone(phone ?? "");
  if (!normalized) {
    return Response.json({ error: "Enter the full number with country code" }, { status: 400 });
  }

  const path = await issueLink(hashPhone(normalized), maskPhone(normalized));
  const link = new URL(path, request.url).toString();

  return Response.json({
    masked: maskPhone(normalized),
    link,
    reply: signInReply(link),
  });
}
