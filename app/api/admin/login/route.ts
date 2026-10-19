import {
  adminSetupProblem,
  endAdminSession,
  passwordMatches,
  startAdminSession,
} from "@/lib/auth/admin";

/**
 * Operator sign in with the admin password
 *
 * Wrong guesses are capped per address, in memory, which is enough to make
 * guessing a long password pointless without a table for it
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRIES = 8;
const tries = new Map<string, { n: number; since: number }>();

function addressOf(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: Request) {
  const problem = adminSetupProblem();
  if (problem) return Response.json({ error: problem }, { status: 503 });

  const ip = addressOf(request);
  const now = Date.now();
  const seen = tries.get(ip);
  if (seen && now - seen.since < WINDOW_MS && seen.n >= MAX_TRIES) {
    return Response.json(
      { error: "Too many wrong passwords, wait fifteen minutes" },
      { status: 429 },
    );
  }

  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  if (!password || !passwordMatches(password)) {
    const fresh = !seen || now - seen.since >= WINDOW_MS;
    tries.set(ip, { n: fresh ? 1 : seen.n + 1, since: fresh ? now : seen.since });
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  tries.delete(ip);
  await startAdminSession();
  return Response.json({ ok: true });
}

export async function DELETE() {
  await endAdminSession();
  return Response.json({ ok: true });
}
