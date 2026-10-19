import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";

/**
 * Makes the value for ADMIN_PASSWORD_HASH
 *
 * The site never stores the admin password, only this scrypt hash of it, so a
 * leaked environment does not hand out the password itself.
 *
 * Usage
 *   node scripts/admin-password.mts            asks for the password
 *   node scripts/admin-password.mts <password> takes it from the command line
 *
 * Paste the printed line into the host's environment as ADMIN_PASSWORD_HASH
 */

async function main() {
  let password = process.argv[2];
  if (!password) {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    password = await rl.question("Admin password: ");
    rl.close();
  }
  if (!password || password.length < 8) {
    throw new Error("Use at least 8 characters");
  }

  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32);
  console.log(`scrypt:${salt.toString("base64url")}:${key.toString("base64url")}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
