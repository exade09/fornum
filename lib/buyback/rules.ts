/**
 * The arithmetic and the checks of the buyback, with nothing else in it
 *
 * No imports, no network, no database: everything here takes plain numbers
 * and returns plain answers, so it is the part the tests cover directly
 * (tests/buyback.test.mts). Lamports are integers held in JS numbers, which
 * is exact up to 2^53, about nine million SOL
 */

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export type BuybackSettings = {
  /** BUYBACK_ENABLED. Off by default: nothing is sent while it is off */
  enabled: boolean;
  /** TREASURY_WALLET, receives the 20% and buys and burns */
  treasuryWallet: string | null;
  /** PLATFORM_TOKEN_MINT, the Fornum token */
  mainMint: string | null;
  minLamports: number;
  maxLamports: number;
  slippageBps: number;
  /** network fees plus rent one operation may cost */
  maxNetworkCostLamports: number;
  /** the same over the last 24 hours */
  dailyNetworkBudgetLamports: number;
  /** what the treasury always keeps for fees and rent */
  minTreasuryBalanceLamports: number;
  /** priority fee per compute unit, micro-lamports */
  priorityMicroLamports: number;
};

export const DEFAULTS = {
  // the least worth one buy: below it the network fee would cost more than the buy
  minLamports: 50_000,
  maxLamports: 1_000_000_000, // 1 SOL
  slippageBps: 300, // 3%
  maxNetworkCostLamports: 5_000_000, // 0.005 SOL, covers a Token-2022 ATA
  dailyNetworkBudgetLamports: 30_000_000, // 0.03 SOL
  minTreasuryBalanceLamports: 20_000_000, // 0.02 SOL
  priorityMicroLamports: 100_000,
} as const;

/** The highest slippage the settings accept, 10% */
export const MAX_SLIPPAGE_BPS = 1_000;

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function lamportsSetting(
  env: Record<string, string | undefined>,
  name: string,
  fallback: number,
  problems: string[],
) {
  const raw = env[name]?.trim();
  if (!raw) return fallback;
  if (!/^\d+$/.test(raw)) {
    problems.push(`${name} must be a whole number of lamports, got "${raw}"`);
    return fallback;
  }
  const n = Number(raw);
  if (!Number.isSafeInteger(n)) {
    problems.push(`${name} is too large`);
    return fallback;
  }
  return n;
}

/** A setting as pasted: spaces, newlines and surrounding quotes removed */
export function cleanSetting(v: string | undefined) {
  return v?.trim().replace(/^["'`]+|["'`]+$/g, "").trim() || undefined;
}

function addressSetting(
  env: Record<string, string | undefined>,
  name: string,
  problems: string[],
  required: boolean,
) {
  const raw = cleanSetting(env[name]);
  if (!raw) {
    if (required) problems.push(`${name} is not set`);
    return null;
  }
  if (!BASE58.test(raw)) {
    problems.push(`${name} is set but is not a Solana address (${raw.length} characters, check for extra symbols)`);
    return null;
  }
  return raw;
}

/**
 * Reads the settings and lists everything wrong with them
 *
 * A problem never throws: the app keeps running and /admin shows the list.
 * Sending is refused while the list is not empty, reconciling is not
 */
export function parseSettings(env: Record<string, string | undefined>) {
  const problems: string[] = [];
  const enabled = cleanSetting(env.BUYBACK_ENABLED)?.toLowerCase() === "true";

  const settings: BuybackSettings = {
    enabled,
    treasuryWallet: addressSetting(env, "TREASURY_WALLET", problems, enabled),
    // optional: until the Fornum token exists, the 20% adds up in the ledger and waits
    mainMint: addressSetting(env, "PLATFORM_TOKEN_MINT", problems, false),
    minLamports: lamportsSetting(env, "BUYBACK_MIN_LAMPORTS", DEFAULTS.minLamports, problems),
    maxLamports: lamportsSetting(env, "BUYBACK_MAX_LAMPORTS", DEFAULTS.maxLamports, problems),
    slippageBps: lamportsSetting(env, "BUYBACK_SLIPPAGE_BPS", DEFAULTS.slippageBps, problems),
    maxNetworkCostLamports: lamportsSetting(
      env,
      "FEE_MAX_NETWORK_COST_LAMPORTS",
      DEFAULTS.maxNetworkCostLamports,
      problems,
    ),
    dailyNetworkBudgetLamports: lamportsSetting(
      env,
      "FEE_DAILY_NETWORK_BUDGET_LAMPORTS",
      DEFAULTS.dailyNetworkBudgetLamports,
      problems,
    ),
    minTreasuryBalanceLamports: lamportsSetting(
      env,
      "MIN_TREASURY_BALANCE_LAMPORTS",
      DEFAULTS.minTreasuryBalanceLamports,
      problems,
    ),
    priorityMicroLamports: lamportsSetting(
      env,
      "BUYBACK_PRIORITY_MICROLAMPORTS",
      DEFAULTS.priorityMicroLamports,
      problems,
    ),
  };

  if (settings.minLamports <= 0) settings.minLamports = 1;
  if (settings.maxLamports < settings.minLamports) {
    problems.push("BUYBACK_MAX_LAMPORTS must not be below BUYBACK_MIN_LAMPORTS");
  }
  if (settings.slippageBps <= 0 || settings.slippageBps > MAX_SLIPPAGE_BPS) {
    problems.push(`BUYBACK_SLIPPAGE_BPS must be between 1 and ${MAX_SLIPPAGE_BPS}`);
  }
  if (settings.slippageBps % 10 !== 0) {
    // the SDK applies slippage in steps of 0.1%
    problems.push("BUYBACK_SLIPPAGE_BPS must be a multiple of 10");
  }
  if (settings.maxNetworkCostLamports <= 0) {
    problems.push("FEE_MAX_NETWORK_COST_LAMPORTS must be above zero");
  }
  if (settings.dailyNetworkBudgetLamports < settings.maxNetworkCostLamports) {
    problems.push("FEE_DAILY_NETWORK_BUDGET_LAMPORTS must cover at least one operation");
  }
  if (settings.treasuryWallet && settings.mainMint && settings.treasuryWallet === settings.mainMint) {
    problems.push("TREASURY_WALLET and PLATFORM_TOKEN_MINT are the same address");
  }

  return { settings, problems };
}

/* ------------------------------------------------------------------ */
/* Budget                                                              */
/* ------------------------------------------------------------------ */

/** How much the next buy may take from the ledger, 0 while it is below the minimum */
export function nextBudget(availableLamports: number, s: Pick<BuybackSettings, "minLamports" | "maxLamports">) {
  if (!Number.isSafeInteger(availableLamports) || availableLamports < s.minLamports) return 0;
  return Math.min(availableLamports, s.maxLamports);
}

/**
 * The quote to price the buy with, so that the quote plus slippage, which is
 * the most the buy can take, stays inside the budget
 */
export function quoteForBudget(budgetLamports: number, slippageBps: number) {
  return Math.floor((budgetLamports * 10_000) / (10_000 + slippageBps));
}

/**
 * The limit the pump SDK puts on a buy for a quote: quote plus slippage, with
 * slippage applied in steps of 0.1% (`quote + quote * floor(pct * 10) / 1000`)
 */
export function maxSpendForQuote(quoteLamports: number, slippageBps: number) {
  const tenths = Math.floor(slippageBps / 10);
  return quoteLamports + Math.floor((quoteLamports * tenths) / 1_000);
}

/* ------------------------------------------------------------------ */
/* Ledger allocation                                                   */
/* ------------------------------------------------------------------ */

export type CreditBalance = { id: string; available: number };
export type Allocation = { creditId: string; lamports: number };

/** Takes `amount` from the oldest credits first */
export function allocate(credits: CreditBalance[], amount: number): Allocation[] {
  const out: Allocation[] = [];
  let left = amount;
  for (const c of credits) {
    if (left <= 0) break;
    const take = Math.min(c.available, left);
    if (take > 0) {
      out.push({ creditId: c.id, lamports: take });
      left -= take;
    }
  }
  if (left > 0) throw new Error("Not enough in the ledger for this budget");
  return out;
}

/**
 * Gives `amount` back, newest allocation first, so what a buy did not spend
 * returns to the credits it came from
 */
export function releaseFrom(allocations: Allocation[], amount: number): Allocation[] {
  const out: Allocation[] = [];
  let left = amount;
  for (const a of [...allocations].reverse()) {
    if (left <= 0) break;
    const back = Math.min(a.lamports, left);
    if (back > 0) {
      out.push({ creditId: a.creditId, lamports: back });
      left -= back;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Receipts                                                            */
/* ------------------------------------------------------------------ */

export type CreditVerdict =
  | { kind: "confirmed"; lamports: number }
  | { kind: "failed"; reason: string }
  | { kind: "manual"; reason: string };

/**
 * What a finalized claim paid the treasury
 *
 * Measured from the balances before and after, never taken from what the
 * claim meant to send. Anything unusual goes to manual review instead of
 * being guessed: the treasury paying the fee, a balance that did not grow, or
 * a different amount than the claim recorded
 */
export function judgeCreditReceipt(r: {
  err: unknown;
  accountKeys: string[];
  preBalances: number[];
  postBalances: number[];
  treasury: string;
  expectedLamports: number;
}): CreditVerdict {
  if (r.err) return { kind: "failed", reason: `the claim failed on chain: ${JSON.stringify(r.err)}` };
  const at = r.accountKeys.indexOf(r.treasury);
  if (at < 0) return { kind: "manual", reason: "the treasury is not in the transaction" };
  if (r.accountKeys.indexOf(r.treasury, at + 1) >= 0) {
    return { kind: "manual", reason: "the treasury appears twice" };
  }
  if (at === 0) return { kind: "manual", reason: "the treasury paid the fee of this transaction" };
  const pre = r.preBalances[at];
  const post = r.postBalances[at];
  if (!Number.isSafeInteger(pre) || !Number.isSafeInteger(post)) {
    return { kind: "manual", reason: "the receipt has no balances for the treasury" };
  }
  const delta = post - pre;
  if (delta <= 0) return { kind: "manual", reason: `the treasury did not gain (${delta})` };
  if (delta !== r.expectedLamports) {
    return {
      kind: "manual",
      reason: `the treasury gained ${delta}, the claim recorded ${r.expectedLamports}`,
    };
  }
  return { kind: "confirmed", lamports: delta };
}

export type BuybackVerdict =
  | {
      kind: "finalized";
      marketSpentLamports: number;
      networkLamports: number;
      burned: bigint;
      notes: string[];
    }
  | { kind: "failed"; reason: string };

/**
 * What a finalized buy-and-burn actually did
 *
 * The treasury's SOL went three ways: the network fee, rent for accounts the
 * transaction opened and kept (the ones its simulation showed), and the
 * market. A temporary WSOL account that is opened and closed in the same
 * transaction nets to zero. The token
 * balance of the treasury must end where it started, and the burn must be the
 * amount the job bought, or it is not marked burned
 */
export function judgeBuybackReceipt(r: {
  err: unknown;
  treasuryPre: number;
  treasuryPost: number;
  feeLamports: number;
  /** before and after of each account the simulation saw opened, 0 when absent */
  openedAccounts: { pre: number; post: number }[];
  ataPreTokens: bigint;
  ataPostTokens: bigint;
  /** BurnChecked amounts found in the transaction for this mint and authority */
  burns: bigint[];
  expectedTokens: bigint;
  reservedLamports: number;
}): BuybackVerdict {
  if (r.err) return { kind: "failed", reason: `the buyback failed on chain: ${JSON.stringify(r.err)}` };
  const notes: string[] = [];
  if (r.burns.length !== 1) {
    return { kind: "failed", reason: `expected one burn, found ${r.burns.length}` };
  }
  if (r.burns[0] !== r.expectedTokens) {
    return { kind: "failed", reason: `burned ${r.burns[0]}, bought ${r.expectedTokens}` };
  }
  if (r.ataPostTokens !== r.ataPreTokens) {
    return {
      kind: "failed",
      reason: `the treasury token balance moved from ${r.ataPreTokens} to ${r.ataPostTokens}`,
    };
  }
  const opened = r.openedAccounts.reduce((a, x) => a + (x.pre === 0 ? x.post : 0), 0);
  const network = r.feeLamports + opened;
  const total = r.treasuryPre - r.treasuryPost;
  const market = total - network;
  if (market < 0) notes.push(`the market leg came out negative (${market})`);
  if (market > r.reservedLamports) {
    notes.push(`spent ${market} on the market, more than the ${r.reservedLamports} reserved`);
  }
  return {
    kind: "finalized",
    marketSpentLamports: Math.max(market, 0),
    networkLamports: network,
    burned: r.burns[0],
    notes,
  };
}

/** Whether a dropped transaction can still land */
export function expired(currentBlockHeight: number, lastValidBlockHeight: number) {
  return currentBlockHeight > lastValidBlockHeight;
}
