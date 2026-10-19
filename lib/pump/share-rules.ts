/**
 * The 80/20 policy every new coin is created with, and how its on-chain state
 * and its payouts are judged
 *
 * No imports, so tests/shares.test.mts checks it directly. Addresses are
 * base58 strings, amounts are lamports in safe integers
 */

export const DEVELOPER_BPS = 8_000;
export const TREASURY_BPS = 2_000;
export const TOTAL_BPS = 10_000;

export type Shareholder = { address: string; shareBps: number };

export type SharePolicy = {
  developer: string;
  treasury: string;
  shareholders: Shareholder[];
};

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const ZERO = "11111111111111111111111111111111";

/**
 * The policy for one launch, or why there cannot be one
 *
 * Exactly two recipients that add up to 10 000 bps: the launch wallet, which
 * created the coin and holds the owner's 80%, and the treasury. Neither may be
 * the sponsor, the wallet that funds launches
 */
export function launchPolicy(input: {
  developer: string;
  treasury: string | null;
  sponsor: string | null;
}): { policy: SharePolicy } | { problem: string } {
  const { developer, treasury, sponsor } = input;
  if (!treasury) return { problem: "TREASURY_WALLET is not set, so the 20% has nowhere to go" };
  for (const [name, v] of [
    ["developer", developer],
    ["treasury", treasury],
  ] as const) {
    if (!BASE58.test(v) || v === ZERO) return { problem: `The ${name} address is not valid` };
  }
  if (developer === treasury) return { problem: "The launch wallet and the treasury are the same address" };
  if (sponsor && developer === sponsor) {
    return { problem: "The funding wallet pays for launches and cannot be a coin's creator" };
  }
  if (sponsor && treasury === sponsor) return { problem: "The treasury is the funding wallet" };
  const shareholders = [
    { address: developer, shareBps: DEVELOPER_BPS },
    { address: treasury, shareBps: TREASURY_BPS },
  ];
  if (shareholders.reduce((a, s) => a + s.shareBps, 0) !== TOTAL_BPS) {
    return { problem: "The shares do not add up to 10 000 bps" };
  }
  return { policy: { developer, treasury, shareholders } };
}

/** What a sharing config and the coin's curve (and pool) say on chain */
export type SharingFacts = {
  sharingOwner: string;
  feesProgram: string;
  version: number;
  mint: string;
  expectedMint: string;
  adminRevoked: boolean;
  shareholders: Shareholder[];
  curveOwner: string;
  pumpProgram: string;
  curveCreator: string;
  sharingAddress: string;
  curveComplete: boolean;
  /** the canonical pool's coin creator, when the coin has graduated */
  poolCoinCreator: string | null;
  mintOwner: string;
  tokenPrograms: string[];
};

/** Every reason the coin's fee split is not exactly the policy, empty when it is */
export function sharingProblems(f: SharingFacts, p: SharePolicy): string[] {
  const out: string[] = [];
  if (!f.tokenPrograms.includes(f.mintOwner)) out.push("the mint is not owned by a token program");
  if (f.curveOwner !== f.pumpProgram) out.push("the bonding curve is not owned by pump");
  if (f.sharingOwner !== f.feesProgram) out.push("the sharing config is not owned by pump fees");
  if (f.mint !== f.expectedMint) out.push("the sharing config is for another mint");
  if (f.version !== 2) out.push(`the sharing config is version ${f.version}, not 2`);
  if (!f.adminRevoked) out.push("the shares can still be changed (admin not revoked)");
  if (f.curveCreator !== f.sharingAddress) out.push("the curve's creator is not the sharing config");
  if (f.curveComplete && f.poolCoinCreator !== f.sharingAddress) {
    out.push("the pool's coin creator is not the sharing config");
  }
  const want = [...p.shareholders].sort((a, b) => a.address.localeCompare(b.address));
  const have = [...f.shareholders].sort((a, b) => a.address.localeCompare(b.address));
  const same =
    want.length === have.length &&
    want.every((s, i) => s.address === have[i].address && s.shareBps === have[i].shareBps);
  if (!same) {
    out.push(
      `the shareholders are ${have.map((s) => `${s.address}:${s.shareBps}`).join(", ") || "none"}`,
    );
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Distribution receipts                                               */
/* ------------------------------------------------------------------ */

export type DistributionVerdict =
  | {
      kind: "confirmed";
      developerLamports: number;
      treasuryLamports: number;
      /** what the treasury paid to run it, when it was the fee payer */
      treasuryCostLamports: number;
    }
  | { kind: "failed"; reason: string }
  | { kind: "manual"; reason: string };

/**
 * What one finalized distribution paid each shareholder
 *
 * Anyone can send a distribution, so this is how the treasury's 20% is
 * measured whoever sent it. Only a plain one is counted: exactly one
 * top-level distribute for this coin, none inside another program's call,
 * no top-level instruction from programs outside pump's and the compute
 * budget. Each payout is the balance change, with what a shareholder paid as
 * the fee payer (the fee and the lamports the system program moved out of
 * it) added back. The two payouts must be 80/20 to within rounding
 */
export function judgeDistribution(r: {
  err: unknown;
  accountKeys: string[];
  preBalances: number[];
  postBalances: number[];
  feeLamports: number;
  developer: string;
  treasury: string;
  topLevelDistributes: number;
  innerDistributes: number;
  unexpectedPrograms: string[];
  /** lamports the system program moved out of each address, by address */
  systemOutflows: Record<string, number>;
}): DistributionVerdict {
  if (r.err) return { kind: "failed", reason: `the transaction failed: ${JSON.stringify(r.err)}` };
  if (r.topLevelDistributes !== 1) {
    return { kind: "manual", reason: `${r.topLevelDistributes} top-level distributions` };
  }
  if (r.innerDistributes > 0) return { kind: "manual", reason: "a distribution inside another program" };
  if (r.unexpectedPrograms.length > 0) {
    return { kind: "manual", reason: `other programs in the transaction: ${r.unexpectedPrograms.join(", ")}` };
  }
  const payer = r.accountKeys[0];
  const share = (who: string) => {
    const at = r.accountKeys.indexOf(who);
    if (at < 0) return null;
    const delta = r.postBalances[at] - r.preBalances[at];
    const paid = (who === payer ? r.feeLamports : 0) + (r.systemOutflows[who] ?? 0);
    return { got: delta + paid, paid };
  };
  const dev = share(r.developer);
  const tre = share(r.treasury);
  if (!dev || !tre) return { kind: "manual", reason: "a shareholder is missing from the transaction" };
  if (dev.got <= 0 || tre.got <= 0) {
    return { kind: "manual", reason: `payouts ${dev.got} and ${tre.got} are not both positive` };
  }
  // dev / tre should be 8000 / 2000; each side is rounded down once
  const skew = Math.abs(dev.got * TREASURY_BPS - tre.got * DEVELOPER_BPS);
  if (skew > TOTAL_BPS * 2) {
    return { kind: "manual", reason: `payouts ${dev.got} and ${tre.got} are not 80/20` };
  }
  return {
    kind: "confirmed",
    developerLamports: dev.got,
    treasuryLamports: tre.got,
    treasuryCostLamports: tre.paid,
  };
}

/**
 * The whole fee a native coin has earned, from what its launch wallet holds
 *
 * The launch wallet only ever receives the 80%, so what reached it (held
 * above its line, plus what the owner already took) is scaled back up to the
 * whole, and what is still waiting at pump.fun is added as it is
 */
export function nativeEarned(input: {
  uncollectedLamports: number;
  walletAboveLineLamports: number;
  claimedLamports: number;
}) {
  const reached = Math.max(input.walletAboveLineLamports, 0) + input.claimedLamports;
  return input.uncollectedLamports + Math.round((reached * TOTAL_BPS) / DEVELOPER_BPS);
}
