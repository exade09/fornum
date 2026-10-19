/**
 * Checks of the buyback rules: budget, slippage ceiling, ledger reservation
 * and return, and how receipts are judged. Pure functions, no network
 *
 *   npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allocate,
  expired,
  judgeBuybackReceipt,
  judgeCreditReceipt,
  maxSpendForQuote,
  nextBudget,
  parseSettings,
  quoteForBudget,
  releaseFrom,
} from "../lib/buyback/rules.ts";

const T = "TreasuryWa11et11111111111111111111111111111";
const B = BigInt;

test("settings are off by default and need nothing while off", () => {
  const { settings, problems } = parseSettings({});
  assert.equal(settings.enabled, false);
  assert.deepEqual(problems, []);
});

test("enabling without the addresses is refused", () => {
  const { problems } = parseSettings({ BUYBACK_ENABLED: "true" });
  assert.ok(problems.some((p) => p.includes("TREASURY_WALLET")));
  assert.ok(problems.some((p) => p.includes("PLATFORM_TOKEN_MINT")));
});

test("negative, fractional and unsafe lamports are refused", () => {
  for (const v of ["-1", "1.5", "1e9", "9007199254740993"]) {
    const { problems } = parseSettings({ BUYBACK_MIN_LAMPORTS: v });
    assert.ok(problems.length > 0, v);
  }
});

test("slippage is capped and must be in steps of 0.1%", () => {
  assert.ok(parseSettings({ BUYBACK_SLIPPAGE_BPS: "1500" }).problems.length > 0);
  assert.ok(parseSettings({ BUYBACK_SLIPPAGE_BPS: "305" }).problems.length > 0);
  assert.deepEqual(parseSettings({ BUYBACK_SLIPPAGE_BPS: "500" }).problems, []);
});

test("max below min is refused", () => {
  const { problems } = parseSettings({ BUYBACK_MIN_LAMPORTS: "100", BUYBACK_MAX_LAMPORTS: "50" });
  assert.ok(problems.some((p) => p.includes("BUYBACK_MAX_LAMPORTS")));
});

test("with no minimum set, any confirmed amount is spent", () => {
  const { settings } = parseSettings({});
  assert.equal(settings.minLamports, 1);
  assert.equal(nextBudget(5, settings), 5);
  assert.deepEqual(parseSettings({ BUYBACK_MIN_LAMPORTS: "0" }).problems, []);
});

test("the budget waits for the minimum and never passes the maximum", () => {
  const s = { minLamports: 1_000, maxLamports: 5_000 };
  assert.equal(nextBudget(999, s), 0);
  assert.equal(nextBudget(1_000, s), 1_000);
  assert.equal(nextBudget(7_000, s), 5_000);
});

test("quote plus the SDK's slippage never passes the budget", () => {
  for (const budget of [1, 999, 10_000_000, 123_456_789, 1_000_000_000]) {
    for (const bps of [10, 100, 300, 1_000]) {
      const q = quoteForBudget(budget, bps);
      assert.ok(maxSpendForQuote(q, bps) <= budget, `${budget} ${bps}`);
    }
  }
});

test("allocation takes the oldest credits first and refuses more than there is", () => {
  const credits = [
    { id: "a", available: 300 },
    { id: "b", available: 500 },
    { id: "c", available: 200 },
  ];
  assert.deepEqual(allocate(credits, 600), [
    { creditId: "a", lamports: 300 },
    { creditId: "b", lamports: 300 },
  ]);
  assert.throws(() => allocate(credits, 1_001));
});

test("what a buy did not spend goes back newest first, never more than taken", () => {
  const taken = [
    { creditId: "a", lamports: 300 },
    { creditId: "b", lamports: 300 },
  ];
  assert.deepEqual(releaseFrom(taken, 400), [
    { creditId: "b", lamports: 300 },
    { creditId: "a", lamports: 100 },
  ]);
  const all = releaseFrom(taken, 10_000);
  assert.equal(all.reduce((a, x) => a + x.lamports, 0), 600);
});

test("a claim receipt counts exactly what reached the treasury", () => {
  const base = {
    err: null,
    accountKeys: ["payer", "owner", T, "system"],
    preBalances: [10_000_000, 0, 5_000_000, 1],
    postBalances: [1_995_000, 6_400_000, 6_600_000, 1],
    treasury: T,
    expectedLamports: 1_600_000,
  };
  assert.deepEqual(judgeCreditReceipt(base), { kind: "confirmed", lamports: 1_600_000 });
});

test("unusual claim receipts go to manual review, failed ones fail", () => {
  const base = {
    err: null,
    accountKeys: ["payer", "owner", T],
    preBalances: [10, 0, 5],
    postBalances: [1, 4, 7],
    treasury: T,
    expectedLamports: 2,
  };
  assert.equal(judgeCreditReceipt({ ...base, err: { InstructionError: [0, "x"] } }).kind, "failed");
  assert.equal(judgeCreditReceipt({ ...base, expectedLamports: 3 }).kind, "manual");
  assert.equal(judgeCreditReceipt({ ...base, accountKeys: [T, "owner", "x"] }).kind, "manual");
  assert.equal(judgeCreditReceipt({ ...base, accountKeys: ["a", "b", "c"] }).kind, "manual");
  assert.equal(judgeCreditReceipt({ ...base, postBalances: [1, 4, 5] }).kind, "manual");
});

const buy = {
  err: null,
  treasuryPre: 100_000_000,
  treasuryPost: 87_900_000,
  feeLamports: 45_000,
  openedAccounts: [{ pre: 0, post: 2_074_080 }],
  ataPreTokens: B(0),
  ataPostTokens: B(0),
  burns: [B(5_000_000)],
  expectedTokens: B(5_000_000),
  reservedLamports: 10_000_000,
};

test("a finalized buyback splits SOL into market, fee and opened account rent", () => {
  const v = judgeBuybackReceipt(buy);
  assert.equal(v.kind, "finalized");
  if (v.kind !== "finalized") return;
  assert.equal(v.networkLamports, 45_000 + 2_074_080);
  assert.equal(v.marketSpentLamports, 12_100_000 - 45_000 - 2_074_080);
  assert.equal(v.burned, B(5_000_000));
  assert.deepEqual(v.notes, []);
});

test("an existing token account costs no rent and its balance must not move", () => {
  const v = judgeBuybackReceipt({
    ...buy,
    openedAccounts: [{ pre: 2_074_080, post: 2_074_080 }],
    ataPreTokens: B(42),
    ataPostTokens: B(42),
  });
  assert.equal(v.kind, "finalized");
  if (v.kind === "finalized") assert.equal(v.networkLamports, 45_000);
  assert.equal(judgeBuybackReceipt({ ...buy, ataPreTokens: B(42), ataPostTokens: B(43) }).kind, "failed");
});

test("a burn that is missing, doubled or of another amount is not a burn", () => {
  assert.equal(judgeBuybackReceipt({ ...buy, burns: [] }).kind, "failed");
  assert.equal(judgeBuybackReceipt({ ...buy, burns: [B(1), B(1)] }).kind, "failed");
  assert.equal(judgeBuybackReceipt({ ...buy, burns: [B(4_999_999)] }).kind, "failed");
  assert.equal(judgeBuybackReceipt({ ...buy, err: { InstructionError: [3, "x"] } }).kind, "failed");
});

test("rent of every opened account is a network cost, not market spend", () => {
  const v = judgeBuybackReceipt({
    ...buy,
    openedAccounts: [
      { pre: 0, post: 2_074_080 },
      { pre: 0, post: 1_316_880 },
    ],
  });
  assert.equal(v.kind, "finalized");
  if (v.kind === "finalized") {
    assert.equal(v.networkLamports, 45_000 + 2_074_080 + 1_316_880);
    assert.equal(v.marketSpentLamports, 12_100_000 - v.networkLamports);
  }
});

test("spending past the reservation is flagged", () => {
  const v = judgeBuybackReceipt({ ...buy, reservedLamports: 1_000_000 });
  assert.equal(v.kind, "finalized");
  if (v.kind === "finalized") assert.ok(v.notes.length > 0);
});

test("a transaction expires only after its last valid block height", () => {
  assert.equal(expired(100, 100), false);
  assert.equal(expired(101, 100), true);
});
