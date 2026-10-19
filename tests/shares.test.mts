/**
 * Checks of the on-chain 80/20: the policy, the state it must leave, and how
 * distribution receipts are measured. Pure functions, no network
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { judgeDistribution, launchPolicy, nativeEarned, sharingProblems } from "../lib/pump/share-rules.ts";

const DEV = "DevWa11et111111111111111111111111111111111";
const TRE = "TreasuryWa11et11111111111111111111111111111";
const SPO = "SponsorWa11et1111111111111111111111111111111";
const SHARING = "Sharing1111111111111111111111111111111111111";

test("the policy is the launch wallet at 8000 and the treasury at 2000", () => {
  const r = launchPolicy({ developer: DEV, treasury: TRE, sponsor: SPO });
  assert.ok("policy" in r);
  if ("policy" in r) {
    assert.deepEqual(r.policy.shareholders, [
      { address: DEV, shareBps: 8000 },
      { address: TRE, shareBps: 2000 },
    ]);
  }
});

test("no treasury, a shared address or the sponsor refuses the launch", () => {
  assert.ok("problem" in launchPolicy({ developer: DEV, treasury: null, sponsor: SPO }));
  assert.ok("problem" in launchPolicy({ developer: DEV, treasury: DEV, sponsor: SPO }));
  assert.ok("problem" in launchPolicy({ developer: SPO, treasury: TRE, sponsor: SPO }));
  assert.ok("problem" in launchPolicy({ developer: DEV, treasury: SPO, sponsor: SPO }));
  assert.ok("problem" in launchPolicy({ developer: "11111111111111111111111111111111", treasury: TRE, sponsor: SPO }));
  assert.ok("problem" in launchPolicy({ developer: "not-an-address", treasury: TRE, sponsor: SPO }));
});

const policy = (launchPolicy({ developer: DEV, treasury: TRE, sponsor: SPO }) as { policy: never }).policy;
const facts = {
  sharingOwner: "pfee",
  feesProgram: "pfee",
  version: 2,
  mint: "M",
  expectedMint: "M",
  adminRevoked: true,
  shareholders: [
    { address: TRE, shareBps: 2000 },
    { address: DEV, shareBps: 8000 },
  ],
  curveOwner: "pump",
  pumpProgram: "pump",
  curveCreator: SHARING,
  sharingAddress: SHARING,
  curveComplete: false,
  poolCoinCreator: null,
  mintOwner: "tok22",
  tokenPrograms: ["tok", "tok22"],
};

test("the exact state passes, in any order of shareholders", () => {
  assert.deepEqual(sharingProblems(facts, policy), []);
});

test("every deviation from the policy is reported", () => {
  assert.equal(sharingProblems({ ...facts, adminRevoked: false }, policy).length, 1);
  assert.equal(sharingProblems({ ...facts, version: 1 }, policy).length, 1);
  assert.equal(sharingProblems({ ...facts, curveCreator: DEV }, policy).length, 1);
  assert.equal(sharingProblems({ ...facts, mint: "X" }, policy).length, 1);
  assert.equal(sharingProblems({ ...facts, sharingOwner: "x" }, policy).length, 1);
  assert.equal(sharingProblems({ ...facts, curveComplete: true, poolCoinCreator: DEV }, policy).length, 1);
  assert.deepEqual(sharingProblems({ ...facts, curveComplete: true, poolCoinCreator: SHARING }, policy), []);
  assert.equal(
    sharingProblems({ ...facts, shareholders: [{ address: DEV, shareBps: 10000 }] }, policy).length,
    1,
  );
  assert.equal(
    sharingProblems(
      { ...facts, shareholders: [{ address: DEV, shareBps: 7000 }, { address: TRE, shareBps: 3000 }] },
      policy,
    ).length,
    1,
  );
});

const dist = {
  err: null,
  accountKeys: [SPO, DEV, TRE, SHARING],
  preBalances: [50_000_000, 15_000_000, 20_000_000, 9_000_000],
  postBalances: [49_995_000, 21_400_000, 21_600_000, 1_000_000],
  feeLamports: 5_000,
  developer: DEV,
  treasury: TRE,
  topLevelDistributes: 1,
  innerDistributes: 0,
  unexpectedPrograms: [],
  systemOutflows: {},
};

test("a plain distribution sent by someone else credits the treasury its 20%", () => {
  const v = judgeDistribution(dist);
  assert.deepEqual(v, { kind: "confirmed", developerLamports: 6_400_000, treasuryLamports: 1_600_000, treasuryCostLamports: 0 });
});

test("when the treasury pays, its fee and rent are added back and booked as cost", () => {
  const v = judgeDistribution({
    ...dist,
    accountKeys: [TRE, DEV, SHARING],
    preBalances: [20_000_000, 15_000_000, 9_000_000],
    // 1 600 000 in, 5 000 fee and 890 880 rent for a sweep out
    postBalances: [20_000_000 + 1_600_000 - 5_000 - 890_880, 21_400_000, 1_000_000],
    systemOutflows: { [TRE]: 890_880 },
  });
  assert.equal(v.kind, "confirmed");
  if (v.kind === "confirmed") {
    assert.equal(v.treasuryLamports, 1_600_000);
    assert.equal(v.treasuryCostLamports, 895_880);
  }
});

test("rounding by a lamport still counts, a different split does not", () => {
  assert.equal(judgeDistribution({ ...dist, postBalances: [49_995_000, 21_400_001, 21_599_999, 1_000_000] }).kind, "confirmed");
  assert.equal(judgeDistribution({ ...dist, postBalances: [49_995_000, 22_000_000, 21_000_000, 1_000_000] }).kind, "manual");
});

test("anything but one plain top-level distribution goes to manual review", () => {
  assert.equal(judgeDistribution({ ...dist, topLevelDistributes: 2 }).kind, "manual");
  assert.equal(judgeDistribution({ ...dist, innerDistributes: 1 }).kind, "manual");
  assert.equal(judgeDistribution({ ...dist, unexpectedPrograms: ["Some1111"] }).kind, "manual");
  assert.equal(judgeDistribution({ ...dist, accountKeys: [SPO, DEV, "x", SHARING] }).kind, "manual");
  assert.equal(judgeDistribution({ ...dist, err: { x: 1 } }).kind, "failed");
});

test("what a native coin earned is what waits plus what reached the wallet, scaled to the whole", () => {
  assert.equal(nativeEarned({ uncollectedLamports: 1_000, walletAboveLineLamports: 6_400_000, claimedLamports: 1_600_000 }), 1_000 + 10_000_000);
  assert.equal(nativeEarned({ uncollectedLamports: 0, walletAboveLineLamports: -5, claimedLamports: 0 }), 0);
});
