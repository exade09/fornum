import { connect, readAccount, RPC_URL } from "../lib/solana/read.ts";

/**
 * Calls the same read three times against the same contract
 *
 * Usage: node scripts/read-account.ts [address]
 * Default target is the SPL Token program, which exists on every cluster
 */

const TARGET =
  process.argv[2] ?? "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const RUNS = 3;

async function main() {
  console.log(`rpc     ${RPC_URL}`);
  console.log(`account ${TARGET}`);
  console.log(`reads   ${RUNS}\n`);

  // one connection for all three reads, same as the app would do
  const connection = connect();

  for (let i = 1; i <= RUNS; i++) {
    const snap = await readAccount(TARGET, connection);

    console.log(`read ${i}`);
    console.log(`  owner       ${snap.owner}`);
    console.log(`  executable  ${snap.executable}`);
    console.log(`  lamports    ${snap.lamports.toLocaleString("en-US")}`);
    console.log(`  data        ${snap.dataLength} bytes`);
    console.log(`  data head   ${snap.dataHead}`);
    console.log(`  slot        ${snap.slot}`);
    console.log(`  took        ${snap.tookMs} ms\n`);
  }
}

main().catch((err) => {
  console.error("read failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
