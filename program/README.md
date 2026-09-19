# fornum-fees

A fee vault per mint, claimable by whoever holds the number.

## Why a vault per mint

pump.fun keeps creator fees in a PDA seeded by the creator, so one wallet holds
the fees of every token it ever launched and nothing on chain says which mint
earned what. Splitting that needs an indexer that replays every trade.

Here the vault is seeded by the mint:

```
config = PDA(["config"])
fees   = PDA(["fees",  mint])   program owned, who the fees belong to
vault  = PDA(["vault", mint])   system owned, SOL only, no data
```

The balance of `vault` is what that token earned. There is nothing to attribute,
no indexer, and no form for typing an amount in by hand. One token's money can
never pay another token's claim, because they are different accounts.

Deposits need no instruction. The vault is a plain system account, so whatever
routes trading fees just transfers SOL to its address.

## Instructions

| Instruction  | Who signs | What it does                                     |
| ------------ | --------- | ------------------------------------------------ |
| `initialize` | authority | Sets the treasury and the service share          |
| `configure`  | authority | Changes share, treasury or authority             |
| `register`   | authority | Opens a vault for a mint, names the recipient    |
| `assign`     | authority | Hands the fees to another number                 |
| `claim`      | authority | Pays out, taking the service share in the same tx |

## The custodial part, stated plainly

Fees belong to a phone number, and a phone number cannot sign a transaction. So
the recipient is carried as a salted hash and the authority signs on its behalf
after the backend has checked the session. Anyone reading this should know the
authority can move any vault.

What the program still guarantees without trusting that key:

- the service share is capped at `MAX_FEE_BPS`, 20 percent, and the cap is in
  code rather than in a document
- a claim can only ever touch the vault of the mint it names
- a vault keeps its rent exemption, so it survives every claim
- `register`, `assign` and `claim` each emit an event, so a handover or a payout
  cannot happen quietly

## Recipient hashes

`recipient` is 32 bytes and matches what `hashPhone` in `lib/auth/session.ts`
produces, the sha256 of `secret:phone`. The raw number never reaches the chain.

## Building

Nothing in this workspace is built by the Next.js app. It needs its own
toolchain:

```bash
cargo install --git https://github.com/solana-foundation/anchor avm --locked
avm install 1.2.0 && avm use 1.2.0
```

Then from this directory:

```bash
anchor keys sync
anchor build
anchor deploy --provider.cluster devnet
```

`anchor keys sync` replaces the placeholder in `declare_id!` and `Anchor.toml`
with the keypair that `anchor build` generated. Do that before the first deploy
or the program will reject its own PDAs.

## Wiring it to the site

Set `FORNUM_PROGRAM_ID` to the deployed address. `lib/solana/program.ts` derives
the PDAs and reads a vault without an Anchor client, so the app needs no new
dependency to show live numbers.

## Anchor version

Written against anchor-lang 1.2.0. The one thing that breaks on 0.31 is
`CpiContext::new`, which took the program's `AccountInfo` there and takes a
`Pubkey` here. Swap `system_program.key()` for `system_program.to_account_info()`
in both calls and it compiles.
