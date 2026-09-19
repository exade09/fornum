import { pick, siteConfig } from "@/lib/config";
import { DEMO_CLAIMS, DEMO_TOKENS } from "@/lib/demo-data";

/**
 * Shaped like the on chain response, so pages keep working once the program
 * lands and only the source swaps
 *
 * Every token here was launched through Fornum. The creator fees accrue to the
 * launch wallet, so there is always something for whoever asked for the launch
 * to claim
 */

export type TokenStatus = "live" | "graduated" | "pending";

export type Token = {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  status: TokenStatus;
  /** masked number the launch came from */
  owner: string;
  /** set when the owner handed the fees to somebody else */
  assignedTo?: string;
  launchedAgo: string;
  /** minutes since launch, used for sorting */
  ageMinutes: number;
  marketCap: number;
  holders: number;
  /** creator fees collected by the launch wallet so far, USD */
  feesAccrued: number;
  /** already sent out to a wallet, USD */
  feesClaimed: number;
};

/** What is left to take right now */
export function claimable(t: Token) {
  return Math.max(t.feesAccrued - t.feesClaimed, 0);
}

/** Who may claim: whoever the fees were handed to, otherwise the owner */
export function feeRecipient(t: Token) {
  return t.assignedTo ?? t.owner;
}

/* ------------------------------------------------------------------ */
/* Claims                                                              */
/* ------------------------------------------------------------------ */

export type Claim = {
  id: string;
  tokenId: string;
  amount: number;
  /** wallet the money went to */
  wallet: string;
  ago: string;
  tx: string;
};

/**
 * The live set. Empty until the program ships, so every counter reads zero
 * rather than a number nobody can verify
 *
 * Turning demoData on in site-config.json swaps in the sample rows, which is
 * what screenshots and walkthroughs use
 */
export const TOKENS: Token[] = siteConfig.demoData ? DEMO_TOKENS : [];
export const CLAIMS: Claim[] = siteConfig.demoData ? DEMO_CLAIMS : [];

export function getToken(id: string) {
  return TOKENS.find((t) => t.id === id);
}

export function claimsForToken(tokenId: string) {
  return CLAIMS.filter((c) => c.tokenId === tokenId);
}

/** Tokens a signed in number may claim from */
export function tokensForNumber(masked: string | null) {
  if (!masked) return [];
  return TOKENS.filter((t) => feeRecipient(t) === masked);
}

/* ------------------------------------------------------------------ */
/* Account layout shown in the docs                                    */
/* ------------------------------------------------------------------ */

export const ACCOUNT_LAYOUT = [
  { off: 0, len: 8, field: "discriminator" },
  { off: 8, len: 32, field: "token mint" },
  { off: 40, len: 32, field: "launch wallet" },
  { off: 72, len: 32, field: "recipient hash" },
  { off: 104, len: 8, field: "fees accrued" },
  { off: 112, len: 8, field: "fees claimed" },
  { off: 120, len: 1, field: "status" },
];

/* ------------------------------------------------------------------ */
/* Live numbers                                                        */
/* ------------------------------------------------------------------ */

export type Stats = {
  tokensLaunched: number;
  feesAccruedUsd: number;
  feesClaimedUsd: number;
  claimableUsd: number;
};

/**
 * Computed from the data above, then any value set in site-config.json or in
 * FORNUM_OVERRIDES replaces the computed one
 */
export function getStats(): Stats {
  const accrued = TOKENS.reduce((sum, t) => sum + t.feesAccrued, 0);
  const claimed = TOKENS.reduce((sum, t) => sum + t.feesClaimed, 0);

  return {
    tokensLaunched: pick("tokensLaunched", TOKENS.length),
    feesAccruedUsd: pick("feesAccruedUsd", accrued),
    feesClaimedUsd: pick("feesClaimedUsd", claimed),
    claimableUsd: Math.max(accrued - claimed, 0),
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export function usd(value: number, fraction = 2) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  })}`;
}

export function compactUsd(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function num(value: number) {
  return value.toLocaleString("en-US");
}
