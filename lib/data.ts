import "server-only";
import { pick } from "@/lib/config";
import { listTokens } from "@/lib/db/store";
import { claimableLamports } from "@/lib/types";

export * from "@/lib/format";

/** Byte layout shown in the docs */
export const ACCOUNT_LAYOUT = [
  { off: 0, len: 8, field: "discriminator" },
  { off: 8, len: 32, field: "token mint" },
  { off: 40, len: 32, field: "launch wallet" },
  { off: 72, len: 32, field: "recipient hash" },
  { off: 104, len: 8, field: "fees accrued" },
  { off: 112, len: 8, field: "fees claimed" },
  { off: 120, len: 1, field: "status" },
];

export type Stats = {
  tokensLaunched: number;
  feesAccruedLamports: number;
  feesClaimedLamports: number;
  claimableLamports: number;
};

/**
 * Computed from what is stored, then any value set in site-config.json or in
 * FORNUM_OVERRIDES replaces the computed one
 */
export async function getStats(): Promise<Stats> {
  const tokens = await listTokens();

  const accrued = tokens.reduce((s, t) => s + t.feesAccruedLamports, 0);
  const claimed = tokens.reduce((s, t) => s + t.feesClaimedLamports, 0);

  return {
    tokensLaunched: pick("tokensLaunched", tokens.length),
    feesAccruedLamports: pick("feesAccruedLamports", accrued),
    feesClaimedLamports: pick("feesClaimedLamports", claimed),
    claimableLamports: tokens.reduce((s, t) => s + claimableLamports(t), 0),
  };
}
