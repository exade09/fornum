import { pick } from "@/lib/config";

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
  | "queued"
  | "verifying"
  | "dialing"
  | "answered"
  | "missed";
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

export const TOKENS: Token[] = [
  {
    id: "ledger-cat",
    mint: "7GkQmARuK3xy9pLd2V8sNfTcH1bZoW4eXjMv6RsUq5Yn",
    name: "Ledger Cat",
    symbol: "LCAT",
    status: "live",
    creator: "4kPq…9xAt",
    recipient: "+1 415 ••• 77 12",
    recipientConfirmed: true,
    launchedAgo: "6m ago",
    ageMinutes: 6,
    marketCap: 199_400,
    holders: 1_284,
    feesClaimed: 3_210,
    feesPaid: 2_568,
    calls: 1,
    answered: 1,
  },
  {
    id: "paper-bag",
    mint: "2QpLxRt8vNcKdF3mZaHbY7wJuE1sPgQ6TiVn4XoBr9Cd",
    name: "Paper Bag",
    symbol: "BAG",
    status: "live",
    creator: "9mTz…4kLp",
    recipient: "+44 7700 ••• 07",
    recipientConfirmed: true,
    launchedAgo: "31m ago",
    ageMinutes: 31,
    marketCap: 174_050,
    holders: 903,
    feesClaimed: 2_025,
    feesPaid: 1_620,
    calls: 2,
    answered: 2,
  },
  {
    id: "stonk-cat",
    mint: "9XcVbN2mQwErTy6uIoP4aSdFgHjKlZx8CvBnM1qWe3Rt",
    name: "Stonk Cat",
    symbol: "STONK",
    status: "live",
    creator: "2vXc…8nQr",
    recipient: "+91 98 ••• 33 65",
    recipientConfirmed: false,
    launchedAgo: "11m ago",
    ageMinutes: 11,
    marketCap: 100_120,
    holders: 612,
    feesClaimed: 1_470,
    feesPaid: 0,
    calls: 1,
    answered: 0,
  },
  {
    id: "money-futurist",
    mint: "4RdTgBnMkLpOiUyTrEwQaZxSvCfDgHjNbVcXm2Qw7Er9",
    name: "Money Futurist",
    symbol: "FUTUR",
    status: "graduated",
    creator: "7bNm…3sKd",
    recipient: "+62 812 ••• 40 58",
    recipientConfirmed: true,
    launchedAgo: "18m ago",
    ageMinutes: 18,
    marketCap: 412_800,
    holders: 2_940,
    feesClaimed: 5_055,
    feesPaid: 4_044,
    calls: 3,
    answered: 3,
  },
  {
    id: "the-underdog",
    mint: "8KtYuIoPlKjHgFdSaZxCvBnM4qWeRtYu7IoPl2KjHgFd",
    name: "The Underdog",
    symbol: "DOG",
    status: "live",
    creator: "5qWe…1rTy",
    recipient: "+380 67 ••• 26 74",
    recipientConfirmed: true,
    launchedAgo: "12m ago",
    ageMinutes: 12,
    marketCap: 3_640,
    holders: 78,
    feesClaimed: 180,
    feesPaid: 144,
    calls: 1,
    answered: 1,
  },
  {
    id: "ape-cat",
    mint: "1VzXcVbNmAsDfGhJkLpQwErTyUiOp3AsDfGhJkLpQwEr",
    name: "Ape Cat",
    symbol: "APECAT",
    status: "live",
    creator: "8zXc…6vBn",
    recipient: "+55 11 ••• 13 90",
    recipientConfirmed: true,
    launchedAgo: "3h ago",
    ageMinutes: 180,
    marketCap: 3_020,
    holders: 141,
    feesClaimed: 3_720,
    feesPaid: 2_976,
    calls: 4,
    answered: 3,
  },
  {
    id: "pump-life",
    mint: "6BnMkLpOiUyTrEwQaZxSvCfDgHjNbVcXm9QwErTy4Uio",
    name: "Pump Life",
    symbol: "PLIFE",
    status: "pending",
    creator: "3rTy…7uIo",
    recipient: "+49 151 ••• 85 33",
    recipientConfirmed: false,
    launchedAgo: "2d ago",
    ageMinutes: 2_880,
    marketCap: 3_110,
    holders: 54,
    feesClaimed: 2_265,
    feesPaid: 0,
    calls: 1,
    answered: 0,
  },
  {
    id: "night-shift",
    mint: "3LyKjHgFdSaZxCvBnMqWeRtYuIoPlKjHgFdSaZxCvBn8",
    name: "Night Shift",
    symbol: "NIGHT",
    status: "live",
    creator: "6yUi…2oPl",
    recipient: "+34 61 ••• 62 19",
    recipientConfirmed: true,
    launchedAgo: "48m ago",
    ageMinutes: 48,
    marketCap: 98_400,
    holders: 501,
    feesClaimed: 1_065,
    feesPaid: 852,
    calls: 2,
    answered: 1,
  },
  {
    id: "green-candle",
    mint: "5DfGhJkLpQwErTyUiOpAsDfGhJkLpQwErTyUiOp1AsDf",
    name: "Green Candle",
    symbol: "GREEN",
    status: "live",
    creator: "1aSd…5fGh",
    recipient: "+81 90 ••• 04 47",
    recipientConfirmed: true,
    launchedAgo: "5h ago",
    ageMinutes: 300,
    marketCap: 61_700,
    holders: 388,
    feesClaimed: 940,
    feesPaid: 752,
    calls: 2,
    answered: 2,
  },
];

export function getToken(id: string) {
  return TOKENS.find((t) => t.id === id);
}

/* ------------------------------------------------------------------ */
/* Calls                                                               */
/* ------------------------------------------------------------------ */

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

export const CALLS: Call[] = [
  {
    id: "c-8842",
    tokenId: "stonk-cat",
    kind: "payout",
    agent: "bot",
    status: "dialing",
    position: 1,
    phone: "+91 98 ••• 33 65",
    script:
      "Your token Stonk Cat earned 1,470 dollars in creator fees. Confirm this number to receive the payout",
    createdAgo: "2m ago",
  },
  {
    id: "c-8841",
    tokenId: "pump-life",
    kind: "payout",
    agent: "operator",
    status: "verifying",
    position: 2,
    phone: "+49 151 ••• 85 33",
    script:
      "Pump Life collected 2,265 dollars in fees. We need to confirm your number before sending",
    createdAgo: "14m ago",
  },
  {
    id: "c-8840",
    tokenId: "night-shift",
    kind: "alert",
    agent: "bot",
    status: "queued",
    position: 3,
    phone: "+34 61 ••• 62 19",
    script: "Night Shift just crossed 100 thousand in market cap",
    createdAgo: "22m ago",
  },
  {
    id: "c-8839",
    tokenId: "ape-cat",
    kind: "payout",
    agent: "bot",
    status: "answered",
    position: 0,
    phone: "+55 11 ••• 13 90",
    script: "Ape Cat fees are on the way to this number",
    createdAgo: "1h ago",
    duration: "0:38",
  },
  {
    id: "c-8838",
    tokenId: "money-futurist",
    kind: "payout",
    agent: "operator",
    status: "answered",
    position: 0,
    phone: "+62 812 ••• 40 58",
    script: "Money Futurist fees have been claimed and sent",
    createdAgo: "2h ago",
    duration: "1:12",
  },
  {
    id: "c-8837",
    tokenId: "the-underdog",
    kind: "alert",
    agent: "bot",
    status: "missed",
    position: 0,
    phone: "+380 67 ••• 26 74",
    script: "The Underdog is trending on Fornum",
    createdAgo: "3h ago",
  },
  {
    id: "c-8836",
    tokenId: "ledger-cat",
    kind: "payout",
    agent: "bot",
    status: "answered",
    position: 0,
    phone: "+1 415 ••• 77 12",
    script: "Ledger Cat fees are ready, confirm to receive them",
    createdAgo: "4h ago",
    duration: "0:44",
  },
  {
    id: "c-8835",
    tokenId: "paper-bag",
    kind: "payout",
    agent: "operator",
    status: "answered",
    position: 0,
    phone: "+44 7700 ••• 07",
    script: "Paper Bag fees have landed in your balance",
    createdAgo: "6h ago",
    duration: "0:57",
  },
];

export function getCall(id: string) {
  return CALLS.find((c) => c.id === id);
}

export function callsForToken(tokenId: string) {
  return CALLS.filter((c) => c.tokenId === tokenId);
}

/* ------------------------------------------------------------------ */
/* Payouts                                                             */
/* ------------------------------------------------------------------ */

export type Payout = {
  id: string;
  tokenId: string;
  amount: number;
  phone: string;
  ago: string;
  receipt: string;
};

export const PAYOUTS: Payout[] = [
  { id: "p-1", tokenId: "money-futurist", amount: 4044, phone: "+62 812 ••• 40 58", ago: "2m", receipt: "CfB7q78Hz2r51J8hXU3pF" },
  { id: "p-2", tokenId: "ape-cat", amount: 2976, phone: "+55 11 ••• 13 90", ago: "14m", receipt: "CfB7q77o4KAmsjfYoLZQi" },
  { id: "p-3", tokenId: "ledger-cat", amount: 2568, phone: "+1 415 ••• 77 12", ago: "31m", receipt: "CfB7q6vtj4wkNfswvPW91" },
  { id: "p-4", tokenId: "paper-bag", amount: 1620, phone: "+44 7700 ••• 07", ago: "1h", receipt: "CfB7q6xNyGSH54FFzXGDZ" },
  { id: "p-5", tokenId: "night-shift", amount: 852, phone: "+34 61 ••• 62 19", ago: "2h", receipt: "CfB7q6vdtpmmWtCssq57p" },
  { id: "p-6", tokenId: "green-candle", amount: 752, phone: "+81 90 ••• 04 47", ago: "4h", receipt: "CfB7q6tQWJ1LXFzrgRGco" },
  { id: "p-7", tokenId: "the-underdog", amount: 144, phone: "+380 67 ••• 26 74", ago: "5h", receipt: "CfB7q6sKmN2pQrStUvWxY" },
  { id: "p-8", tokenId: "ape-cat", amount: 96, phone: "+55 11 ••• 13 90", ago: "7h", receipt: "CfB7q6rJlM1oPqRsTuVwX" },
  { id: "p-9", tokenId: "ledger-cat", amount: 64, phone: "+1 415 ••• 77 12", ago: "9h", receipt: "CfB7q6qIkL0nOpQrStUvW" },
  { id: "p-10", tokenId: "paper-bag", amount: 30, phone: "+44 7700 ••• 07", ago: "11h", receipt: "CfB7q6pHjK9mNoPqRsTuV" },
];

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export type Profile = {
  handle: string;
  name: string;
  wallet: string;
  bio: string;
  numbers: { masked: string; confirmedAgo: string; active: boolean }[];
};

export const PROFILES: Profile[] = [
  {
    handle: "4kPq9xAt",
    name: "Ledger Cat",
    wallet: "4kPqR7sT9xAtBcDeFgHiJkLmNoPqRsTuVwXyZ1a2b3c",
    bio: "Launches tokens through Fornum and takes creator fees straight to WhatsApp",
    numbers: [
      { masked: "+1 415 ••• 77 12", confirmedAgo: "3 days ago", active: true },
      { masked: "+44 7700 ••• 07", confirmedAgo: "2 weeks ago", active: true },
      { masked: "+91 98 ••• 33 65", confirmedAgo: "a month ago", active: false },
    ],
  },
];

export function getProfile(handle: string) {
  return PROFILES.find((p) => p.handle === handle) ?? PROFILES[0];
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
  answerRatePct: number;
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
  const finished = CALLS.filter(
    (c) => c.status === "answered" || c.status === "missed",
  );
  const answered = finished.filter((c) => c.status === "answered").length;

  const claimed = TOKENS.reduce((sum, t) => sum + t.feesClaimed, 0);
  const paid = TOKENS.reduce((sum, t) => sum + t.feesPaid, 0);

  return {
    callsInQueue: pick("callsInQueue", queued),
    callsLive: pick("callsLive", live),
    tokensLaunched: pick("tokensLaunched", TOKENS.length),
    feesClaimedUsd: pick("feesClaimedUsd", claimed),
    paidOutUsd: pick("paidOutUsd", paid),
    answerRatePct: pick(
      "answerRatePct",
      finished.length ? Math.round((answered / finished.length) * 100) : 0,
    ),
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
