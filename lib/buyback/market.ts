import "server-only";
import {
  ComputeBudgetProgram,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  Keypair,
  type Connection,
  type TransactionInstruction,
} from "@solana/web3.js";
import {
  ExtensionType,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createBurnCheckedInstruction,
  getAssociatedTokenAddressSync,
  getExtensionTypes,
  unpackAccount,
  unpackMint,
} from "@solana/spl-token";
import BN from "bn.js";
import bs58 from "bs58";
import {
  OnlinePumpSdk,
  PUMP_AMM_PROGRAM_ID,
  PUMP_PROGRAM_ID,
  PUMP_SDK,
  bondingCurvePda,
  getBuyV3QuoteAmountFromTokenAmount,
  getBuyV3TokenAmountFromQuoteAmount,
} from "@pump-fun/pump-sdk";
import {
  OnlinePumpAmmSdk,
  PUMP_AMM_SDK,
  buyQuoteInput,
  canonicalPumpPoolPda,
} from "@pump-fun/pump-swap-sdk";
import { maxSpendForQuote, quoteForBudget, type BuybackSettings } from "@/lib/buyback/rules";

/**
 * One transaction that buys the Fornum token and burns exactly what it bought
 *
 * The treasury is the fee payer, the buyer, the owner of the token account and
 * the burn authority. The buy asks for an exact number of base units with a
 * ceiling on the SOL it may take, and the burn names the same number, so if
 * either fails the whole transaction does and nothing is left half done.
 *
 * Two markets, priced and built with pump.fun's own SDKs: the SOL bonding
 * curve (`buy_v3`) while it trades, and the coin's canonical PumpSwap SOL pool
 * (`buy`) once it has graduated. Anything else is refused
 */

/** Token-2022 extensions a pump coin carries, and nothing that could change an amount */
const SAFE_EXTENSIONS = new Set([ExtensionType.MetadataPointer, ExtensionType.TokenMetadata]);

const COMPUTE_UNITS = 400_000;

export type MintFacts = {
  mint: PublicKey;
  tokenProgram: PublicKey;
  decimals: number;
  supply: bigint;
};

/** The checks on the coin itself, before any money moves */
export async function inspectMint(connection: Connection, mintAddress: string): Promise<MintFacts> {
  const mint = new PublicKey(mintAddress);
  const info = await connection.getAccountInfo(mint, "confirmed");
  if (!info) throw new Error("PLATFORM_TOKEN_MINT does not exist on this cluster");
  const program = info.owner;
  if (!program.equals(TOKEN_PROGRAM_ID) && !program.equals(TOKEN_2022_PROGRAM_ID)) {
    throw new Error(`The mint belongs to ${program.toBase58()}, not a token program`);
  }
  const m = unpackMint(mint, info, program);
  if (!m.isInitialized) throw new Error("The mint is not initialized");
  if (m.freezeAuthority) throw new Error("The mint has a freeze authority");
  if (m.supply <= BigInt(0)) throw new Error("The mint has no supply");
  if (program.equals(TOKEN_2022_PROGRAM_ID)) {
    const unsafe = getExtensionTypes(m.tlvData).filter((e) => !SAFE_EXTENSIONS.has(e));
    if (unsafe.length > 0) {
      throw new Error(`The mint has extensions this buyback does not handle: ${unsafe.map((e) => ExtensionType[e]).join(", ")}`);
    }
  }
  return { mint, tokenProgram: program, decimals: m.decimals, supply: m.supply };
}

/** Both pump programs must be live programs on this cluster */
export async function programsReady(connection: Connection) {
  const [pump, amm] = await connection.getMultipleAccountsInfo([PUMP_PROGRAM_ID, PUMP_AMM_PROGRAM_ID]);
  return Boolean(pump?.executable && amm?.executable);
}

export type BuyPlan = {
  market: "curve" | "pool";
  instructions: TransactionInstruction[];
  /** base units the buy brings in and the burn destroys */
  tokenAmount: bigint;
  /** the most SOL the buy is allowed to take */
  maxQuoteLamports: number;
  quoteLamports: number;
};

const isSolQuote = (q: PublicKey) => q.equals(PublicKey.default) || q.equals(NATIVE_MINT);

/** Prices and builds the buy for `budgetLamports`, on whichever market the coin trades */
async function planBuy(
  connection: Connection,
  facts: MintFacts,
  treasury: PublicKey,
  budgetLamports: number,
  slippageBps: number,
): Promise<BuyPlan> {
  const pump = new OnlinePumpSdk(connection);
  const quoteBudget = quoteForBudget(budgetLamports, slippageBps);
  const slippagePct = slippageBps / 100;

  const curveInfo = await connection.getAccountInfo(bondingCurvePda(facts.mint), "confirmed");
  if (!curveInfo || !curveInfo.owner.equals(PUMP_PROGRAM_ID)) {
    throw new Error("The coin has no pump.fun bonding curve");
  }
  const state = await pump.fetchBuyState(facts.mint, treasury, facts.tokenProgram);
  const curve = state.bondingCurve;
  if (!isSolQuote(curve.quoteMint)) throw new Error("The coin is not quoted in SOL");
  if (curve.isMayhemMode) throw new Error("Mayhem coins are not supported");
  if (curve.isCashbackCoin) throw new Error("Cashback coins are not supported");

  if (!curve.complete) {
    const [global, feeConfig] = await Promise.all([pump.fetchGlobal(), pump.fetchFeeConfig()]);
    const common = {
      global,
      feeConfig,
      mintSupply: curve.tokenTotalSupply,
      bondingCurve: curve,
      curveBaseTokenBalance: state.curveBaseTokenBalance,
      quoteTransferFee: state.quoteTransferFee,
    };
    const tokens = getBuyV3TokenAmountFromQuoteAmount({ ...common, amount: new BN(quoteBudget) });
    if (tokens.lten(0)) throw new Error("The budget buys nothing on the curve");
    // a buy past what is left would complete the curve and buy on from a pool
    // that does not exist yet, which this buyback does not do
    if (tokens.gte(curve.realTokenReserves)) throw new Error("The buy would complete the curve, wait for the pool");
    const quote = getBuyV3QuoteAmountFromTokenAmount({ ...common, amount: tokens }).toNumber();
    const maxQuote = maxSpendForQuote(quote, slippageBps);
    if (maxQuote > budgetLamports) throw new Error(`The buy could take ${maxQuote}, over the ${budgetLamports} budget`);

    const instructions = await PUMP_SDK.buyV3Instructions({
      bondingCurve: curve,
      associatedUserAccountInfo: state.associatedUserAccountInfo,
      mint: facts.mint,
      user: treasury,
      amount: tokens,
      quoteAmount: new BN(quote),
      slippage: slippagePct,
      tokenProgram: facts.tokenProgram,
      quoteTokenProgram: state.quoteTokenProgram,
    });
    return {
      market: "curve",
      instructions,
      tokenAmount: BigInt(tokens.toString()),
      maxQuoteLamports: maxQuote,
      quoteLamports: quote,
    };
  }

  // graduated: the canonical PumpSwap pool against SOL
  const amm = new OnlinePumpAmmSdk(connection);
  const poolKey = canonicalPumpPoolPda(facts.mint);
  const swap = await amm.swapSolanaState(poolKey, treasury);
  const pool = swap.pool;
  if (!swap.poolAccountInfo?.owner.equals(PUMP_AMM_PROGRAM_ID)) throw new Error("The canonical pool is not a PumpSwap pool");
  if (!pool.baseMint.equals(facts.mint)) throw new Error("The pool is for another coin");
  if (!pool.quoteMint.equals(NATIVE_MINT)) throw new Error("The pool is not quoted in SOL");
  if (pool.isMayhemMode) throw new Error("Mayhem pools are not supported");
  if (pool.isCashbackCoin) throw new Error("Cashback pools are not supported");
  if (!pool.coinCreator.equals(curve.creator)) throw new Error("The pool and the curve name different creators");

  const { base, maxQuote } = buyQuoteInput({
    quote: new BN(quoteBudget),
    slippage: slippagePct,
    baseReserve: swap.poolBaseAmount,
    quoteReserve: swap.poolQuoteAmount,
    virtualQuoteReserves: pool.virtualQuoteReserves,
    globalConfig: swap.globalConfig,
    baseMintAccount: swap.baseMintAccount,
    baseMint: swap.baseMint,
    coinCreator: pool.coinCreator,
    creator: pool.creator,
    feeConfig: swap.feeConfig,
    quoteMint: pool.quoteMint,
    isMayhemMode: pool.isMayhemMode,
    creatorFeeBps: pool.creatorFeeBps,
    quoteTransferFee: swap.quoteTransferFee,
  });
  if (base.lten(0)) throw new Error("The budget buys nothing in the pool");
  const max = maxQuote.toNumber();
  if (max > budgetLamports) throw new Error(`The buy could take ${max}, over the ${budgetLamports} budget`);

  const instructions = await PUMP_AMM_SDK.buyInstructions(swap, base, maxQuote);
  return {
    market: "pool",
    instructions,
    tokenAmount: BigInt(base.toString()),
    maxQuoteLamports: max,
    quoteLamports: quoteBudget,
  };
}

export type SignedBuyback = {
  tx: VersionedTransaction;
  signature: string;
  lastValidBlockHeight: number;
  plan: BuyPlan;
  decimals: number;
  expectedNetworkLamports: number;
  simulatedMarketLamports: number;
  /** accounts the transaction opens, whose rent is a network cost */
  openedAccounts: string[];
};

/**
 * Builds, signs and simulates the buy-and-burn, and checks the simulation
 *
 * Refuses unless the simulation shows: the market leg inside the budget, the
 * network cost inside its limit, the treasury above its reserve, and the
 * treasury's token balance ending exactly where it started.
 *
 * Given only a public key it builds and simulates without signing, for the
 * dry run: nothing that comes out of that can be sent
 */
export async function signBuyback(
  connection: Connection,
  treasuryKey: Keypair | PublicKey,
  mintAddress: string,
  budgetLamports: number,
  s: BuybackSettings,
  networkSpentToday: number,
): Promise<SignedBuyback> {
  const signer = treasuryKey instanceof Keypair ? treasuryKey : null;
  const treasury = signer ? signer.publicKey : (treasuryKey as PublicKey);
  const facts = await inspectMint(connection, mintAddress);
  const ata = getAssociatedTokenAddressSync(facts.mint, treasury, false, facts.tokenProgram);
  const [treasuryBefore, ataBefore] = await connection.getMultipleAccountsInfo([treasury, ata], "confirmed");
  if (!treasuryBefore) throw new Error("The treasury has no SOL");
  let tokensBefore = BigInt(0);
  if (ataBefore) {
    const acc = unpackAccount(ata, ataBefore, facts.tokenProgram);
    if (!acc.owner.equals(treasury) || !acc.mint.equals(facts.mint)) {
      throw new Error("The treasury token account belongs to someone else or another mint");
    }
    tokensBefore = acc.amount;
  }

  const plan = await planBuy(connection, facts, treasury, budgetLamports, s.slippageBps);
  const instructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: COMPUTE_UNITS }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: s.priorityMicroLamports }),
    createAssociatedTokenAccountIdempotentInstruction(treasury, ata, treasury, facts.mint, facts.tokenProgram),
    ...plan.instructions,
    createBurnCheckedInstruction(ata, facts.mint, treasury, plan.tokenAmount, facts.decimals, [], facts.tokenProgram),
  ];

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
  const message = new TransactionMessage({
    payerKey: treasury,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  if (signer) tx.sign([signer]);
  if (tx.serialize().length > 1232) throw new Error("The transaction is too large without a lookup table");

  const fee = (await connection.getFeeForMessage(message, "confirmed")).value;
  if (fee === null) throw new Error("Could not price the transaction fee");

  // every account the transaction may write, to see which ones it opens
  const writable = message.staticAccountKeys.filter(
    (k, i) => message.isAccountWritable(i) && !k.equals(treasury) && !k.equals(ata),
  );
  const writableBefore = await connection.getMultipleAccountsInfo(writable, "confirmed");

  const sim = await connection.simulateTransaction(tx, {
    sigVerify: Boolean(signer),
    commitment: "confirmed",
    accounts: {
      encoding: "base64",
      addresses: [treasury.toBase58(), ata.toBase58(), ...writable.map((k) => k.toBase58())],
    },
  });
  if (sim.value.err) {
    throw new Error(`Simulation failed: ${JSON.stringify(sim.value.err)} ${(sim.value.logs ?? []).slice(-3).join(" | ")}`);
  }
  const [tAfter, aAfter, ...othersAfter] = sim.value.accounts ?? [];
  if (!tAfter || !aAfter) throw new Error("The simulation did not return the treasury accounts");
  const ataAfterInfo = {
    data: Buffer.from(aAfter.data[0], "base64"),
    executable: aAfter.executable,
    lamports: aAfter.lamports,
    owner: new PublicKey(aAfter.owner),
    rentEpoch: aAfter.rentEpoch,
  };
  const after = unpackAccount(ata, ataAfterInfo, facts.tokenProgram);
  if (!after.owner.equals(treasury) || !after.mint.equals(facts.mint)) {
    throw new Error("The simulated token account is not the treasury's for this mint");
  }
  if (after.amount !== tokensBefore) {
    throw new Error(`The simulated token balance moved from ${tokensBefore} to ${after.amount}`);
  }

  // rent of accounts the transaction opens and keeps: the token account on a
  // first buy, pump's volume tracker for a new trader. A temporary WSOL
  // account is opened and closed inside it and does not show up here
  const openedAccounts: string[] = [];
  let opened = 0;
  if (!ataBefore) {
    openedAccounts.push(ata.toBase58());
    opened += aAfter.lamports;
  }
  writable.forEach((k, i) => {
    const post = othersAfter[i];
    if (!writableBefore[i] && post && post.lamports > 0 && Buffer.from(post.data[0], "base64").length > 0) {
      openedAccounts.push(k.toBase58());
      opened += post.lamports;
    }
  });
  const network = fee + opened;
  const market = treasuryBefore.lamports - tAfter.lamports - network;
  if (market > budgetLamports) throw new Error(`The simulation spends ${market}, over the ${budgetLamports} budget`);
  if (network > s.maxNetworkCostLamports) {
    throw new Error(`The network cost ${network} is over FEE_MAX_NETWORK_COST_LAMPORTS`);
  }
  if (networkSpentToday + network > s.dailyNetworkBudgetLamports) {
    throw new Error("FEE_DAILY_NETWORK_BUDGET_LAMPORTS is used up for today");
  }
  // the worst case, the whole ceiling taken, still leaves the reserve
  if (treasuryBefore.lamports - plan.maxQuoteLamports - network < s.minTreasuryBalanceLamports) {
    throw new Error("The treasury would drop below MIN_TREASURY_BALANCE_LAMPORTS");
  }

  return {
    tx,
    signature: bs58.encode(tx.signatures[0]),
    lastValidBlockHeight,
    plan,
    decimals: facts.decimals,
    expectedNetworkLamports: network,
    simulatedMarketLamports: market,
    openedAccounts,
  };
}
