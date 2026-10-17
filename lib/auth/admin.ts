import "server-only";

/**
 * Checks the operator's bearer token
 *
 * Null when the request may go on, otherwise the response to send back. Same
 * rule as every other admin route: a shared secret in ADMIN_TOKEN, because
 * this is one person with a console, not an account system
 */
export function refuseUnlessAdmin(request: Request): Response | null {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return Response.json(
      { error: "ADMIN_TOKEN is not set on this deployment" },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ error: "Not allowed" }, { status: 401 });
  }
  return null;
}
