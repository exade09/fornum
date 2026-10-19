import { refuseUnlessAdmin } from "@/lib/auth/admin";
import { approveCode, approveWithoutMessage, cleanCode, listPending, normalizePhone } from "@/lib/auth/verify";
import { hashPhone } from "@/lib/auth/session";

/** Codes visitors were given and have not been confirmed yet */
export async function GET(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;

  return Response.json({ pending: await listPending() });
}

/**
 * The operator confirms a code that arrived in the thread
 *
 * They type the code and the number it came from, as WhatsApp shows it. The
 * number is only hashed and compared with the one typed on the site
 */
export async function POST(request: Request) {
  const refused = await refuseUnlessAdmin(request);
  if (refused) return refused;

  const body = (await request.json()) as { code?: string; phone?: string; withoutMessage?: boolean };
  const code = cleanCode(body.code ?? "");
  const phone = normalizePhone(body.phone ?? "");

  // the operator knows the number is theirs some other way
  if (body.withoutMessage && code) {
    const r = await approveWithoutMessage(code);
    return r.ok
      ? Response.json({ masked: r.masked })
      : Response.json({ error: "No code like that is waiting. It may have expired or been used" }, { status: 404 });
  }

  if (!code || !phone) {
    return Response.json(
      { error: "Enter the six character code and the full number it came from" },
      { status: 400 },
    );
  }

  const result = await approveCode(code, hashPhone(phone));

  if (!result.ok) {
    return Response.json(
      {
        error:
          result.reason === "wrong-number"
            ? "That code was asked for with a different number. Do not confirm it"
            : "No code like that is waiting. It may have expired or been used",
      },
      { status: result.reason === "wrong-number" ? 409 : 404 },
    );
  }

  return Response.json({ masked: result.masked });
}
