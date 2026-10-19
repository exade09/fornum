import {
  type Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";

/**
 * Everything pump.fun owes one creator, moved into the creator's wallet
 *
 * Since the v3 trades, pump.fun no longer pays the creator fee out on every
 * trade: it waits on the bonding curve (`BondingCurve.creator_fee`) or on the
 * PumpSwap pool (`Pool.creator_fees`) until somebody sweeps it into the
 * creator vault. So a full collect is, per pump.fun's own docs
 * (docs/instructions/SWEEP_FEES.md and COLLECT_CREATOR_FEE.md):
 *
 *   curve:  sweep_creator_fee, then collect_creator_fee_v2 (pays lamports)
 *   pool:   sweep_creator_fee, then collect_coin_creator_fee (pays wrapped
 *           SOL), then close the wrapped SOL account to get plain SOL
 *
 * Built by hand from the published IDL so it does not depend on a third party
 * keeping up with pump.fun's upgrades. Only SOL-paired coins, which is all
 * Fornum launches. No imports from the app, so a script can check it
 */

export const PUMP = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
export const PUMP_AMM = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
export const WSOL = new PublicKey("So11111111111111111111111111111111111111112");
const TOKEN = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ATA = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const pda = (seeds: (Buffer | Uint8Array)[], program: PublicKey) =>
  PublicKey.findProgramAddressSync(seeds, program)[0];
const s = (v: string) => Buffer.from(v);
export const ata = (owner: PublicKey, mint = WSOL) =>
  pda([owner.toBuffer(), TOKEN.toBuffer(), mint.toBuffer()], ATA);

export const bondingCurve = (mint: PublicKey) => pda([s("bonding-curve"), mint.toBuffer()], PUMP);
export const curveVault = (creator: PublicKey) => pda([s("creator-vault"), creator.toBuffer()], PUMP);
export const ammVaultAuthority = (creator: PublicKey) =>
  pda([s("creator_vault"), creator.toBuffer()], PUMP_AMM);
export const ammVault = (creator: PublicKey) => ata(ammVaultAuthority(creator));
export const canonicalPool = (mint: PublicKey) =>
  pda(
    [s("pool"), Buffer.from([0, 0]), pda([s("pool-authority"), mint.toBuffer()], PUMP).toBuffer(), mint.toBuffer(), WSOL.toBuffer()],
    PUMP_AMM,
  );

/** Field offsets from the published IDL (8 byte discriminator included) */
export const CURVE_CREATOR = 49;
export const CURVE_CREATOR_FEE = 125;
export const POOL_QUOTE_ACCOUNT = 171;
export const POOL_CREATOR_FEES = 279;

const SWEEP = Buffer.from([32, 246, 191, 52, 8, 201, 73, 186]);
const COLLECT_V2 = Buffer.from([207, 17, 138, 242, 4, 34, 19, 56]);
const COLLECT_COIN = Buffer.from([160, 57, 89, 42, 181, 139, 43, 66]);

const w = (pubkey: PublicKey) => ({ pubkey, isSigner: false, isWritable: true });
const r = (pubkey: PublicKey) => ({ pubkey, isSigner: false, isWritable: false });

export function curveSweepAndCollect(payer: PublicKey, creator: PublicKey, mint: PublicKey) {
  const curve = bondingCurve(mint);
  const vault = curveVault(creator);
  const events = pda([s("__event_authority")], PUMP);
  return [
    new TransactionInstruction({
      programId: PUMP,
      data: SWEEP,
      keys: [
        { pubkey: payer, isSigner: true, isWritable: true },
        r(pda([s("global")], PUMP)),
        r(mint),
        r(WSOL),
        r(TOKEN),
        r(ATA),
        r(SystemProgram.programId),
        w(curve),
        w(ata(curve)),
        w(vault),
        w(ata(vault)),
        r(events),
        r(PUMP),
      ],
    }),
    new TransactionInstruction({
      programId: PUMP,
      data: COLLECT_V2,
      keys: [
        w(creator),
        w(ata(creator)),
        w(vault),
        w(ata(vault)),
        r(WSOL),
        r(TOKEN),
        r(ATA),
        r(SystemProgram.programId),
        r(events),
        r(PUMP),
      ],
    }),
  ];
}

export function poolSweepAndCollect(
  payer: PublicKey,
  creator: PublicKey,
  pool: PublicKey,
  poolQuoteAccount: PublicKey,
) {
  const authority = ammVaultAuthority(creator);
  const vault = ata(authority);
  const creatorWsol = ata(creator);
  const events = pda([s("__event_authority")], PUMP_AMM);
  return [
    new TransactionInstruction({
      programId: PUMP_AMM,
      data: SWEEP,
      keys: [
        { pubkey: payer, isSigner: true, isWritable: true },
        r(pda([s("global_config")], PUMP_AMM)),
        w(pool),
        r(WSOL),
        r(TOKEN),
        w(poolQuoteAccount),
        r(authority),
        w(vault),
        r(SystemProgram.programId),
        r(ATA),
        r(events),
        r(PUMP_AMM),
      ],
    }),
    // the creator's wrapped SOL account has to exist to receive the fees
    new TransactionInstruction({
      programId: ATA,
      data: Buffer.from([1]), // create idempotent
      keys: [
        { pubkey: payer, isSigner: true, isWritable: true },
        w(creatorWsol),
        r(creator),
        r(WSOL),
        r(SystemProgram.programId),
        r(TOKEN),
      ],
    }),
    new TransactionInstruction({
      programId: PUMP_AMM,
      data: COLLECT_COIN,
      keys: [r(WSOL), r(TOKEN), r(creator), r(authority), w(vault), w(creatorWsol), r(events), r(PUMP_AMM)],
    }),
    // and is closed again, which unwraps everything in it to plain SOL
    new TransactionInstruction({
      programId: TOKEN,
      data: Buffer.from([9]),
      keys: [w(creatorWsol), w(creator), { pubkey: creator, isSigner: true, isWritable: false }],
    }),
  ];
}

/**
 * The instructions that bring every waiting fee of one coin home
 *
 * Reads the curve and the pool first, so a coin still on the curve gets only
 * the curve part, and a coin with nothing waiting gets nothing at all
 */
export async function collectInstructions(connection: Connection, creator: PublicKey, mint: PublicKey) {
  const pool = canonicalPool(mint);
  const [curveInfo, poolInfo] = await connection.getMultipleAccountsInfo([bondingCurve(mint), pool]);
  const ixs: TransactionInstruction[] = [];
  if (curveInfo) ixs.push(...curveSweepAndCollect(creator, creator, mint));
  if (poolInfo && poolInfo.data.length >= POOL_QUOTE_ACCOUNT + 32) {
    const quote = new PublicKey(poolInfo.data.subarray(POOL_QUOTE_ACCOUNT, POOL_QUOTE_ACCOUNT + 32));
    ixs.push(...poolSweepAndCollect(creator, creator, pool, quote));
  }
  return ixs;
}
