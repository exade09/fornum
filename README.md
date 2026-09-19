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
/signin           sign in with a phone number, code over SMS or WhatsApp
/docs             how it works, including the money flow
/admin            pin the counters shown on the site
/legal/*          terms and privacy
```

Only four are in the navigation: home, launch, tokens, claims. The rest are
reached from the footer or from a card.

## The number

Every launch, confirmation and payout goes through one WhatsApp thread, so the
number is the largest element on the home page rather than a footnote. It lives
in `content/site-config.json` under `whatsapp`, currently a placeholder in the
reserved `555-01xx` fictional range so it cannot ring a real person. Swap both
`display` and `e164` when the Business number is live.

## Counters

Every number on the site is computed from activity in `lib/data.ts`. To show a
different figure, pin it:

- edit `content/site-config.json` and push, the deploy picks it up
- or set `FORNUM_OVERRIDES` on the host to the same object, which wins over the
  file

A key left as `null` falls back to the computed value, so nothing is ever
invented by accident. `/admin` has a form that builds the JSON for you and shows
which counters are currently pinned.

```json
{ "overrides": { "callsInQueue": 2, "callsLive": 1 } }
```

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
and is handed to whoever places the call, for the length of that call. Revoking
consent removes the number from every future call.

## Signing in

A phone number is the account. `/signin` sends a one time code over WhatsApp,
or SMS if the visitor picks that, and the session is a signed cookie holding a
salted hash of the number plus a masked copy for display. The raw number is
never in the cookie.

Delivery goes through Twilio Verify: one API for both channels, with Meta
approved authentication templates included, so no template review is needed.
Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_VERIFY_SERVICE_SID`
to switch it on. With those unset the flow runs on a local stub that accepts
`000000`, so the whole path can be walked before an account exists.

`lib/auth/verify.ts` is the only file that knows about the provider.

## Status

The interface is complete and runs on demo data from `lib/data.ts`. Next up: the
Anchor program with the token account and escrow, wallet signing, and a live
stream of the queue.
