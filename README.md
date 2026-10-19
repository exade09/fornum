# Fornum

Launch a token with one WhatsApp message and keep the creator fees.

Live at [fornum-exed.vercel.app](https://fornum-exed.vercel.app)

You text Fornum a name, a ticker and a picture. A person reads it, deploys the
token on pump.fun from a Fornum launch wallet, and replies with the mint
address. The creator fees that token earns are recorded against your number,
and you claim them here to any Solana address. You can also hand the fees of a
token to somebody else's number.

There is no bot, no form and no phone calls. The launch is a conversation, the
site is where the money is.

## Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 16, App Router, RSC, Turbopack             |
| Styling    | Tailwind CSS v4, tokens declared in CSS            |
| Motion     | CSS keyframes only, no animation library           |
| Fonts      | Geist Sans and Geist Mono through `next/font`      |
| Chain      | Solana, program in progress                        |

## Running it

```bash
npm install
npm run dev
```

Production build is `npm run build`, serve it with `npm start`.

## Routes

```
/                 the number, the thread it runs through, live counters
/launch           how to launch, the number and the rules
/tokens           everything launched here, fees and who they belong to
/token/[id]       one token: fees, claim, hand over, claim history
/payouts          claims, every one with a transaction
/signin           sign in with a phone number by writing to it, link a wallet
/s/[token]        one time sign in link from the chat
/docs             how it works, including the money flow
/admin            sign ins, launches, fees and the counters shown on the site
/legal/*          terms and privacy
```

Only four are in the navigation: home, launch, tokens, claims. The rest are
reached from the footer or from a card.

## The number

Every launch, confirmation and payout goes through one WhatsApp thread, so the
number is the largest element on the home page rather than a footnote. It is
+1 (631) 660-1838, and it lives in `content/site-config.json` under `whatsapp`.
`display` is what the site prints, `e164` is what `wa.me` links are built from,
digits only and no plus. Change one and you have to change the other, or the
number on screen stops matching the thread it opens.

## Database

Schema is `db/schema.sql`, run it once against `DATABASE_URL`. Tables: tokens,
claims and launch requests. Amounts are lamports, stored as bigint.

Without `DATABASE_URL` the whole app falls back to an in memory store, so every
page renders before anything is provisioned. That store resets on restart,
which is the point: it is not a database. `lib/db/store.ts` is the only file
that knows which one is in use.

## Claiming

Creator fees accrue to the launch wallet that deployed the mint. pump.fun holds
them until the creator collects, so a claim first sweeps and collects them
into the launch wallet (one transaction built from pump.fun's published IDL,
`lib/pump/collect.ts`), then sends a plain SOL transfer to the address the
recipient gives us. Fees are never typed in: what a token earned is read off
the chain, pump.fun's creator vaults plus the wallet above its funding line
plus what was claimed (`lib/tokens.ts`).

`POST /api/claim` checks the session against the token's recipient hash, reads
the wallet balance on chain, sends the transfer, then writes the claim and moves
the claimed total in one transaction, so the same fees cannot go out twice. The
wallet keeps a small reserve so it can always pay for the next transaction.

`POST /api/assign` hands the fees of a token to another number. One way on
purpose: the new holder can pass them on again, the sender cannot pull them
back.

`POST /api/admin/launch` launches a coin from `/admin`: the picture and the
metadata are pinned to IPFS (`PINATA_JWT`), the coin is created on pump.fun
through PumpPortal from the first funded, unused launch wallet, and the mint is
recorded by itself. A JSON body with `mint` still records a coin deployed some
other way.

`/admin` is behind a password. Only its scrypt hash is kept, in
`ADMIN_PASSWORD_HASH`, made with `node scripts/admin-password.mts`. The
operator routes take that session cookie, or `ADMIN_TOKEN` as a bearer token
for scripts.

## Counters

Every number comes from the database. To show a different figure, pin it in
`content/site-config.json` or in `FORNUM_OVERRIDES` on the host. A key left as
`null` falls back to the computed value.

## Icons

Token art is optional. When a launch has no image, `TokenMark` draws one from the
ticker: hue, gradient angle and pattern all come from the symbol, so the same
token looks identical everywhere and no slot is ever empty. Wallet marks are
inline SVG, nothing depends on a remote asset.

## Design system

Tokens live in `app/globals.css` in two layers. The raw layer is a named palette
from `ivory` to `jet`. The semantic layer holds `--background`, `--card`,
`--primary`, `--border`, `--brand` and the rest as bare HSL triples, which is
what makes `text-primary/70` and `border-primary/[0.06]` work.

Dark mode inverts `--primary` and `--accent`, so one button class reads white on
black and black on white.

Motion honours `prefers-reduced-motion`. Components that carry real data, such as
digit reels and progress bars, also write their end state inline, so turning
animation off never shows a wrong number.

## Privacy

Only a salted hash of a phone number goes on chain. The mapping lives off chain
and is what the operator reads to answer the thread. Nothing is ever sent to a
number that did not write first.

## Signing in

A phone number is the account, and nothing talks to WhatsApp or to an SMS
provider to prove it. The number stays in the WhatsApp Business app on the
operator's phone, exactly as it is for launches, and the operator is the
bridge between the thread and the site. There are two ways in.

**A link in the launch reply.** When the operator records a launch in
`/admin`, the site writes the reply for the thread: the mint and a one time
link for the launcher's number. The operator only ever replies to the number
that wrote, so the thread itself proves who will open it. The link lands on
`/s/[token]`, which waits for a button press because WhatsApp fetches every
link to draw a preview. A link works once and for a week. Somebody who writes
asking to sign in gets a fresh one from the same panel.

**A code sent from the number.** On `/signin` the visitor types their number
and gets a short code with a `wa.me` link to the Fornum number. They send it,
it shows up in the chat and in the sign in queue on `/admin`, and the operator
types the number it came from next to it. The site confirms only if that
number hashes to the one typed on the site, and only the browser that asked
holds the secret, an httpOnly cookie, that turns the confirmation into a
session. The page polls `/api/auth/check` and moves on by itself. A code
waits a day, and the page picks it up again if the visitor comes back. Five
codes an hour per number, no other limit.

After either, the visitor links a wallet, connected from Phantom, Solflare or
Backpack or pasted, and every claim goes there unless another address is typed
for that claim. Wallets live in `accounts`, keyed by the number's hash.

Run `db/004-whatsapp-sign-in.sql` and `db/005-sign-in-links.sql` once.
`lib/auth/verify.ts` holds the codes, `lib/auth/sign-in-links.ts` the links and
`lib/replies.ts` the text the operator pastes.

## Status

The interface is complete and runs on demo data from `lib/data.ts`. Next up: the
Anchor program with the token account and escrow, wallet signing, and a live
stream of the queue.
