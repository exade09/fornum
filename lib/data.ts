import { pick, siteConfig } from "@/lib/config";
import {
  DEMO_CALLS,
  DEMO_PAYOUTS,
  DEMO_PROFILES,
  DEMO_TOKENS,
} from "@/lib/demo-data";

/**
 * Demo data shaped like the on chain response, so pages keep working once the
 * program lands and only the source swaps
 *
 * Every token here was launched through Fornum. That is the whole point: fees
 * exist because we deployed the mint with our treasury as the fee recipient,
 * so there is always a number to send them to
 */

export type TokenStatus = "live" | "graduated" | "pending";
export type CallStatus =
  "queued" | "verifying" | "dialing" | "answered" | "missed";
export type Agent = "bot" | "operator";

export type Token = {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  status: TokenStatus;
  /** wallet that signed the launch */
  creator: string;
  /** masked number the creator fees are pointed at */
  recipient: string;
  recipientConfirmed: boolean;
  launchedAgo: string;
  /** minutes since launch, used for sorting and for the live counters */
  ageMinutes: number;
  marketCap: number;
  holders: number;
  feesClaimed: number;
  feesPaid: number;
  calls: number;
  answered: number;
};

export type Call = {
  id: string;
  tokenId: string;
  /** payout tells the recipient money is on the way, alert is a holder ping */
  kind: "payout" | "alert";
  agent: Agent;
  status: CallStatus;
  position: number;
  phone: string;
  script: string;
  createdAgo: string;
  duration?: string;
};

export type Payout = {
  id: string;
  tokenId: string;
  amount: number;
  phone: string;
  ago: string;
  receipt: string;
};

export type Profile = {
  handle: string;
  name: string;
  wallet: string;
  bio: string;
  numbers: { masked: string; confirmedAgo: string; active: boolean }[];
};

/**
 * The live set. Empty until the program ships, so every counter on the site
 * reads zero rather than a number nobody can verify
 *
 * Turning demoData on in site-config.json swaps in the sample rows, which is
 * what screenshots and walkthroughs use
 */
export const TOKENS: Token[] = siteConfig.demoData ? DEMO_TOKENS : [];
export const CALLS: Call[] = siteConfig.demoData ? DEMO_CALLS : [];
export const PAYOUTS: Payout[] = siteConfig.demoData ? DEMO_PAYOUTS : [];
export const PROFILES: Profile[] = siteConfig.demoData ? DEMO_PROFILES : [];

export function getToken(id: string) {
  return TOKENS.find((t) => t.id === id);
}

export function getCall(id: string) {
  return CALLS.find((c) => c.id === id);
}

export function callsForToken(tokenId: string) {
  return CALLS.filter((c) => c.tokenId === tokenId);
}

export function getProfile(handle: string) {
  return PROFILES.find((p) => p.handle === handle) ?? null;
}

export function tokensByCreator(creator: string) {
  return TOKENS.filter((t) => t.creator === creator);
}

/* ------------------------------------------------------------------ */
/* Account layout shown in the docs tile                               */
/* ------------------------------------------------------------------ */

export const ACCOUNT_LAYOUT = [
  { off: 0, len: 8, field: "discriminator" },
  { off: 8, len: 32, field: "token mint" },
  { off: 40, len: 32, field: "creator" },
  { off: 72, len: 32, field: "recipient hash" },
  { off: 104, len: 8, field: "fees claimed" },
  { off: 112, len: 8, field: "fees paid" },
  { off: 120, len: 4, field: "queue index" },
  { off: 124, len: 1, field: "status" },
];

/* ------------------------------------------------------------------ */
/* Live numbers                                                        */
/* ------------------------------------------------------------------ */

export type Stats = {
  callsInQueue: number;
  callsLive: number;
  tokensLaunched: number;
  feesClaimedUsd: number;
  paidOutUsd: number;
  inEscrowUsd: number;
};

/**
 * Computed from the data above, then any value set in site-config.json or in
 * FORNUM_OVERRIDES replaces the computed one
 */
export function getStats(): Stats {
  const queued = CALLS.filter(
    (c) => c.status === "queued" || c.status === "verifying",
  ).length;
  const live = CALLS.filter((c) => c.status === "dialing").length;
  const claimed = TOKENS.reduce((sum, t) => sum + t.feesClaimed, 0);
  const paid = TOKENS.reduce((sum, t) => sum + t.feesPaid, 0);

  return {
    callsInQueue: pick("callsInQueue", queued),
    callsLive: pick("callsLive", live),
    tokensLaunched: pick("tokensLaunched", TOKENS.length),
    feesClaimedUsd: pick("feesClaimedUsd", claimed),
    paidOutUsd: pick("paidOutUsd", paid),
    inEscrowUsd: Math.max(claimed - paid, 0),
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
