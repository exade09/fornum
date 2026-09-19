import { PublicKey } from "@solana/web3.js";
import { connect } from "@/lib/solana/read";
import "server-only";

/**
 * Reading the fee program without an Anchor client
 *
 * Everything here is derivation and byte offsets, so the site can show what a
 * token has earned with nothing installed beyond web3.js. The program itself is
 * in `program/`, and its account layout is the contract this file depends on:
 * change the struct there and the offsets below have to move with it
 */

const CONFIG_SEED = Buffer.from("config");
const FEES_SEED = Buffer.from("fees");
const VAULT_SEED = Buffer.from("vault");

/** Set once the program is deployed. Without it the site stays on stored numbers */
export function programId(): PublicKey | null {
  const id = process.env.FORNUM_PROGRAM_ID;
  if (!id) return null;
  try {
    return new PublicKey(id.trim());
  } catch {
    return null;
  }
}

export function configPda(program: PublicKey) {
  return PublicKey.findProgramAddressSync([CONFIG_SEED], program)[0];
}

export function feesPda(mint: PublicKey, program: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [FEES_SEED, mint.toBuffer()],
    program,
  )[0];
}

/** Where this one mint's fees land. A plain system account, so anything can pay into it */
export function vaultPda(mint: PublicKey, program: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [VAULT_SEED, mint.toBuffer()],
    program,
  )[0];
}

/**
 * FeeAccount as the program lays it out
 *
 * 8 bytes of Anchor discriminator, then the struct in declaration order
 */
const OFFSET = {
  mint: 8,
  recipient: 40,
  claimed: 72,
  handovers: 80,
  createdAt: 82,
  bump: 90,
  vaultBump: 91,
} as const;

export const FEE_ACCOUNT_SIZE = 92;

export type OnChainFees = {
  mint: string;
  /** salted phone hash, hex, matching what hashPhone writes */
  recipient: string;
  /** paid out so far, gross of the service share */
  claimedLamports: number;
  handovers: number;
  createdAt: string;
  /** sitting in the vault right now, above the rent floor */
  claimableLamports: number;
};

/** Rent exemption for a zero byte account, which is the floor a vault keeps */
let rentFloor: number | null = null;

async function vaultFloor() {
  if (rentFloor !== null) return rentFloor;
  rentFloor = await connect().getMinimumBalanceForRentExemption(0);
  return rentFloor;
}

/**
 * What one token has earned, straight off the chain
 *
 * This is the whole reason the vault is derived from the mint: the balance is
 * the answer, so nothing has to be attributed and nobody has to type a number
 * into a form. Returns null when the program is not deployed or the mint was
 * never registered
 */
export async function readFees(mint: string): Promise<OnChainFees | null> {
  const program = programId();
  if (!program) return null;

  let mintKey: PublicKey;
  try {
    mintKey = new PublicKey(mint.trim());
  } catch {
    return null;
  }

  const connection = connect();
  const fees = feesPda(mintKey, program);
  const vault = vaultPda(mintKey, program);

  const [account, balance, floor] = await Promise.all([
    connection.getAccountInfo(fees),
    connection.getBalance(vault),
    vaultFloor(),
  ]);

  if (!account || account.data.length < FEE_ACCOUNT_SIZE) return null;

  const data = account.data;
  return {
    mint: new PublicKey(data.subarray(OFFSET.mint, OFFSET.mint + 32)).toBase58(),
    recipient: Buffer.from(
      data.subarray(OFFSET.recipient, OFFSET.recipient + 32),
    ).toString("hex"),
    // lamports fit in a double long before they fit in a u64, so Number is safe
    claimedLamports: Number(data.readBigUInt64LE(OFFSET.claimed)),
    handovers: data.readUInt16LE(OFFSET.handovers),
    createdAt: new Date(
      Number(data.readBigInt64LE(OFFSET.createdAt)) * 1000,
    ).toISOString(),
    claimableLamports: Math.max(balance - floor, 0),
  };
}
