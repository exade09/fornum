import * as anchor from "@anchor-lang/core";
import { Program } from "@anchor-lang/core";
import { assert } from "chai";
import { FornumFees } from "../target/types/fornum_fees";

/**
 * The properties worth holding the program to
 *
 * Not a walk through the happy path: each test is one thing that must stay true
 * even when the authority key is the only thing standing between a vault and
 * somebody else's money
 */
describe("fornum-fees", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.FornumFees as Program<FornumFees>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const authority = provider.wallet;
  const treasury = anchor.web3.Keypair.generate();

  const SEED_CONFIG = Buffer.from("config");
  const SEED_FEES = Buffer.from("fees");
  const SEED_VAULT = Buffer.from("vault");

  const config = anchor.web3.PublicKey.findProgramAddressSync(
    [SEED_CONFIG],
    program.programId,
  )[0];

  const pdasFor = (mint: anchor.web3.PublicKey) => ({
    fees: anchor.web3.PublicKey.findProgramAddressSync(
      [SEED_FEES, mint.toBuffer()],
      program.programId,
    )[0],
    vault: anchor.web3.PublicKey.findProgramAddressSync(
      [SEED_VAULT, mint.toBuffer()],
      program.programId,
    )[0],
  });

  const hash = (s: string) => {
    const b = Buffer.alloc(32);
    Buffer.from(s).copy(b);
    return [...b];
  };

  /** Pay into a vault the way a trading program would, with a plain transfer */
  async function fund(vault: anchor.web3.PublicKey, lamports: number) {
    const tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: vault,
        lamports,
      }),
    );
    await provider.sendAndConfirm(tx);
  }

  it("sets up once and refuses a share above the cap", async () => {
    await program.methods
      .initialize(500)
      .accounts({ authority: authority.publicKey, treasury: treasury.publicKey })
      .rpc();

    const state = await program.account.config.fetch(config);
    assert.equal(state.feeBps, 500);
    assert.isTrue(state.treasury.equals(treasury.publicKey));

    try {
      await program.methods.configure(2001, null, null).rpc();
      assert.fail("a 20 percent cap that can be exceeded is not a cap");
    } catch (err: any) {
      assert.include(err.toString(), "FeeTooHigh");
    }
  });

  it("gives each mint its own vault, so one claim cannot reach another", async () => {
    const a = anchor.web3.Keypair.generate().publicKey;
    const b = anchor.web3.Keypair.generate().publicKey;

    for (const mint of [a, b]) {
      await program.methods
        .register(hash(`owner-of-${mint.toBase58()}`))
        .accounts({ authority: authority.publicKey, mint })
        .rpc();
    }

    const pa = pdasFor(a);
    const pb = pdasFor(b);
    assert.notEqual(pa.vault.toBase58(), pb.vault.toBase58());

    await fund(pa.vault, 1_000_000);

    const floor = await provider.connection.getMinimumBalanceForRentExemption(0);
    const balanceB = await provider.connection.getBalance(pb.vault);
    assert.equal(balanceB - floor, 0, "b earned nothing and must show nothing");

    // asking b's vault for a's money fails, because it is a different account
    try {
      await program.methods
        .claim(new anchor.BN(1_000_000))
        .accounts({
          authority: authority.publicKey,
          fees: pb.fees,
          destination: anchor.web3.Keypair.generate().publicKey,
          treasury: treasury.publicKey,
        })
        .rpc();
      assert.fail("b paid out money it never earned");
    } catch (err: any) {
      assert.include(err.toString(), "AmountTooLarge");
    }
  });

  it("pays out, takes the share, and leaves the vault alive", async () => {
    const mint = anchor.web3.Keypair.generate().publicKey;
    const { fees, vault } = pdasFor(mint);
    const destination = anchor.web3.Keypair.generate().publicKey;

    await program.methods
      .register(hash("claimer"))
      .accounts({ authority: authority.publicKey, mint })
      .rpc();

    await fund(vault, 2_000_000);

    const floor = await provider.connection.getMinimumBalanceForRentExemption(0);
    const before = await provider.connection.getBalance(treasury.publicKey);
    const amount = 2_000_000;

    await program.methods
      .claim(new anchor.BN(amount))
      .accounts({
        authority: authority.publicKey,
        fees,
        destination,
        treasury: treasury.publicKey,
      })
      .rpc();

    const cut = Math.floor((amount * 500) / 10_000);
    assert.equal(
      await provider.connection.getBalance(destination),
      amount - cut,
    );
    assert.equal(
      (await provider.connection.getBalance(treasury.publicKey)) - before,
      cut,
    );
    assert.equal(
      await provider.connection.getBalance(vault),
      floor,
      "a drained vault must still be rent exempt",
    );

    const state = await program.account.feeAccount.fetch(fees);
    assert.equal(state.claimed.toNumber(), amount);

    // and the same fees cannot go out twice
    try {
      await program.methods
        .claim(new anchor.BN(1))
        .accounts({
          authority: authority.publicKey,
          fees,
          destination,
          treasury: treasury.publicKey,
        })
        .rpc();
      assert.fail("an empty vault paid out again");
    } catch (err: any) {
      assert.include(err.toString(), "AmountTooLarge");
    }
  });

  it("hands fees to another number and records that it happened", async () => {
    const mint = anchor.web3.Keypair.generate().publicKey;
    const { fees } = pdasFor(mint);

    await program.methods
      .register(hash("first-number"))
      .accounts({ authority: authority.publicKey, mint })
      .rpc();

    await program.methods.assign(hash("second-number")).accounts({ fees }).rpc();

    const state = await program.account.feeAccount.fetch(fees);
    assert.deepEqual([...state.recipient], hash("second-number"));
    assert.equal(state.handovers, 1);
  });

  it("refuses anyone who is not the authority", async () => {
    const stranger = anchor.web3.Keypair.generate();
    const mint = anchor.web3.Keypair.generate().publicKey;

    const sig = await provider.connection.requestAirdrop(
      stranger.publicKey,
      anchor.web3.LAMPORTS_PER_SOL,
    );
    await provider.connection.confirmTransaction(sig);

    try {
      await program.methods
        .register(hash("not-yours"))
        .accounts({ authority: stranger.publicKey, mint })
        .signers([stranger])
        .rpc();
      assert.fail("a stranger opened a vault");
    } catch (err: any) {
      assert.include(err.toString(), "Unauthorized");
    }
  });
});
