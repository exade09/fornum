# Posts for X

Ready copy for the Fornum account. Everything here has been checked against how
the product actually works, which the first drafts had not been: they described
phone calls, dollar payouts and an escrow, none of which exist.

Post these as they are. If something needs changing, change it here first, so
the file stays the one place the copy lives.

## House style

- Short declarative lines. Verb first where it fits
- Periods where they carry rhythm, not at the end of every line. The site rule
  is stricter, no periods at all, and that rule stays on the site
- No em dashes, no emoji, no exclamation marks
- Name the mechanics plainly: WhatsApp, pump.fun, SOL, mint, creator fees
- Concrete over abstract. Say 80 and 20, not "a share"
- Write by outcome, not by staffing. "The coin is deployed on pump.fun" rather
  than either "a person deploys it" or "a bot deploys it". The first sounds
  small, the second is not true

## Never publish again

These came from the first drafts and from stale site copy that has since been
fixed. None of it is true.

| Claim | Reality |
| --- | --- |
| We call to confirm, answer the call, a recorded voice, a live operator | There are no calls anywhere in the product |
| We pay out in dollars | Payout is SOL, to an address the claimer pastes |
| Fees sit in escrow until consent | No escrow, no consent gate |
| Every trade pays a 2% tax | pump.fun takes 1.25% of a trade, of which the creator gets 0.30%. Fornum adds nothing |
| We burn the fees from other coins launched through Fornum | Reads as burning customer money. Only the Fornum 20% is involved |
| Your place in the queue is a field in the token account | No queue, and the program is not deployed |
| Register yourself, bring a friend | No registration, no referrals. Reads like a pyramid |
| It is automated, a bot handles it, instant, 24/7 | Launches are done by the team. Say what happens, not who does it, and never promise a speed the thread cannot keep |

One more that is true but not yet running: the treasury buying the Fornum token
and burning it. It is written in the docs at the owner's decision. Do not build
a post around it until the buyback actually runs, because it is the first thing
anyone will check.

---

# Article

Long form, for an X article rather than a thread. About 600 words.

```
A launchpad that lives in one WhatsApp thread

Fornum turns a message into a coin. You send a name, a ticker and a
picture to one WhatsApp number. The coin is deployed on pump.fun and
the mint address comes back in the same thread. There is no app to
install, no wallet to connect and no account to create.

What a launch is

Three things. A name, a ticker, and a picture. That is the entire form.
Send the picture as a photo rather than a link, square images look best.
The mint usually comes back within a couple of minutes.

Launching costs you nothing. Creating a coin on Solana has a network
cost of about 0.0117 SOL, and Fornum pays it.

Where the money comes from

Every coin on pump.fun pays its creator a share of each trade. On the
bonding curve that share is 0.30%, and it tiers down after the coin
graduates as its market cap grows. It is not a tax anyone adds. It is
part of how the venue already works, and it accrues for as long as
people trade the coin.

That share is what Fornum is about.

The split

When the coin is made, it is given two fee recipients. 80% goes to a
wallet that belongs to your launch. 20% goes to Fornum.

This is not a promise in a document. It is written into the coin itself
through pump.fun's own fee sharing, and then locked. After that nobody
can change it, including us. Anyone can read it off the chain and check
the numbers.

Why the coin has to be launched here

Creator fees go wherever the coin was pointed at the moment it was
created, and that is fixed for as long as the coin exists. A coin
started somewhere else pays its fees somewhere else. There would be
nothing for us to hold and nobody on file to pay.

That is the whole reason the launch runs through the thread, and why
every coin listed on the site came out of one.

A wallet for every launch

Each launch gets its own wallet, and its fees accrue there and nowhere
else. Two coins never share one. That means one person's fees can never
be paid out of another person's coin, and the figure on your token page
is read straight off that wallet instead of being typed in by us.

Taking the money

Sign in on the site with the number you launched from. A one time code
arrives by SMS or WhatsApp, whichever you pick. Your phone number is
the account, so there is no password to choose.

Open your coin, paste any Solana address, and take what has accrued.
The payout is SOL, it leaves a transaction on the token page, and
anyone can check it. Claim as often or as rarely as you like. Fees keep
building while you wait and nothing expires.

Handing the fees to someone else

On the token page you can point a coin's fees at another WhatsApp
number. From that moment everything the coin earns belongs to them,
including what has built up and not been claimed yet.

It works in one direction on purpose. The new holder can pass it on
again, the sender cannot pull it back. Check the number before you
confirm.

Your number

It never goes on chain. What goes on chain is a salted hash of it,
which cannot be turned back into the number. The mapping stays off
chain, and the site shows a masked number everywhere a number appears.

Fornum will never message you first, and will never ask for a seed
phrase or a private key. If something claiming to be us does, it is
not us.

Start

Text Fornum on WhatsApp
+1 (605) 981-6581

Send a name, a ticker and a picture. The mint comes back in the thread.
```

---

# Posts

## 1. Positioning, for the pinned post

```
Fornum is a launchpad on WhatsApp

Send a name, a ticker and a picture
We deploy the coin on pump.fun and send the mint back in the thread

No app. No wallet. One thread.
```

## 2. How to launch

```
How to launch

Text Fornum on WhatsApp
Send a name, a ticker and a picture
The mint comes back in the same thread

Launching is free. We pay the network cost.
```

## 3. The split

The strongest post in the set. The 80/20 being locked on chain is the one claim
a competitor cannot copy without doing the same thing.

```
80% of the creator fees are yours

The split is written into the coin when it is made, through pump.fun fee sharing

80 to the wallet of your launch
20 to Fornum

Then it is locked. Nobody can change it after that, including us.
Read it off the chain yourself
```

## 4. No wallet

```
You do not need a wallet to launch

WhatsApp is enough
Send a name, a ticker and a picture
The mint comes back in the thread

A wallet is only for taking the money out. Sign in with the same
number, paste a Solana address, claim what the coin earned
```

## 5. Privacy

```
Your number never goes on chain

Only a salted hash does
The mapping stays off chain
The site shows a masked number and never a full one, to anyone
```

## 6. Handing the fees over

```
You can point a coin's fees at someone else's number

From that moment everything it earns is theirs, including what has
not been claimed yet

One direction only. They can pass it on, you cannot pull it back.
```

## 7. A wallet for every launch

```
Every launch gets a wallet of its own

Two coins never share one, so one person's fees can never be paid
out of another person's coin

What your token page shows is read off that wallet, not typed in by us
```

---

# Notes for whoever writes the next batch

The site is the source of truth for mechanics, and `/docs` is the page to read
before writing anything. If a post and the docs disagree, the docs are right
and the post is the bug.

Two lines are worth repeating across posts on purpose, because repetition is
what turns a phrase into a brand:

- Send a name, a ticker and a picture
- No app, no wallet

Both are literal instructions rather than slogans, which is why they survive
being said again.
