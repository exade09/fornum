import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "How Fornum works: one message launches a token, its creator fees split on chain, and you claim your share with the number you launched from",
};

/** The path a launch takes, from a message to money in a wallet */
const FLOW = [
  { label: "Message", sub: "name, ticker, picture" },
  { label: "Launch", sub: "deployed on pump.fun" },
  { label: "Trading", sub: "creator fees build up" },
  { label: "Sign in", sub: "same number, on the site" },
  { label: "Claim", sub: "fees to your wallet" },
];

type Section = {
  id: string;
  title: string;
  body: string[];
  /** rendered under the prose, for the few places a figure says it faster */
  figure?: "split" | "flow";
};

const SECTIONS: Section[] = [
  {
    id: "overview",
    title: "Overview",
    body: [
      "Fornum turns a WhatsApp message into a token. You send a name, a ticker and a picture, a person reads it and deploys that token on pump.fun, and the mint address comes back in the same thread",
      "Every coin on pump.fun pays a share of each trade to whoever created it. That share is what Fornum is about. It is split on chain the moment the coin is made, most of it to you, and you take your part from this site with the number you launched from",
      "There is no app to install, no wallet to connect and no account to create. The thread is the product, and the site is where the money is",
    ],
  },
  {
    id: "number",
    title: "The number",
    body: [
      `Everything runs through one WhatsApp thread on ${siteConfig.whatsapp.display}. Launches, confirmations and questions all live there, which is why the number is the largest thing on the home page rather than a footnote`,
      "Nothing is ever asked of you outside that thread. Fornum will not call you, will not message you first and will never ask for a seed phrase or a private key. If something claiming to be us does, it is not us",
    ],
  },
  {
    id: "launching",
    title: "Launching",
    body: [
      "Text LAUNCH to the number. You will be asked for three things: a name, a ticker and a picture. Send the picture as a photo rather than a link, square images look best",
      "A person reads the message and deploys the coin by hand, which usually takes a couple of minutes. You get the mint address back, and from that moment the coin trades like any other on pump.fun",
      "Launching costs you nothing. The network fees for creating the coin are paid by Fornum",
    ],
  },
  {
    id: "why-here",
    title: "Why the token has to come from here",
    body: [
      "Creator fees go wherever the coin was pointed at the moment it was created, and that is fixed for as long as the coin exists. A coin deployed somewhere else pays its fees somewhere else, and there is nothing for us to hold for you",
      "That is the whole reason the launch runs through the thread. Every token you see on this site was created here, which is what makes its fees claimable here",
    ],
  },
  {
    id: "split",
    title: "How the fees are split",
    body: [
      "At launch the coin is given two fee recipients: a wallet that belongs to your launch, and the Fornum treasury. The split is eighty to twenty in your favour",
      "This is not a promise in a document. It is written into the coin on chain, through pump.fun's own fee sharing, and then locked. After that nobody can change it, including us. Anyone can read it off the chain and check",
    ],
    figure: "split",
  },
  {
    id: "where",
    title: "Where your fees sit",
    body: [
      "Each launch gets a wallet of its own, and your eighty percent accrues to that wallet and nothing else. Two coins never share a wallet, so one person's fees can never be paid out of another person's coin",
      "The number on your token page is read straight from that wallet, not from a figure somebody typed in. What it shows is what is actually there",
    ],
  },
  {
    id: "signing-in",
    title: "Signing in",
    body: [
      "Your phone number is your account. Enter it on the sign in page and a one time code arrives by SMS or WhatsApp, whichever you pick",
      "There is no password to choose and nothing to remember. The number that launched a coin is the number that can claim it",
    ],
  },
  {
    id: "claiming",
    title: "Claiming",
    body: [
      "Open your token and paste any Solana address. The claim sends what has built up to that address and leaves the transaction on the token page, so there is a public record of every payout",
      "You can claim as often or as rarely as you like. Fees keep accruing while you wait, and nothing expires",
    ],
  },
  {
    id: "handing-over",
    title: "Handing the fees to another number",
    body: [
      "On the token page you can point your fees at somebody else's WhatsApp number. From that moment everything the coin earns belongs to them, including what has built up and not been claimed yet",
      "This is one way on purpose. The new holder can pass it on again, the sender cannot pull it back. Make sure the number is right before you confirm",
    ],
  },
  {
    id: "cost",
    title: "What it costs",
    body: [
      "Nothing up front. Fornum keeps twenty percent of the creator fees and pays for the launch itself out of that",
      "The only other cost is the Solana network fee on your claim, which comes out of the amount being sent and is a fraction of a cent",
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    body: [
      "Your number is never written to the chain. What goes on chain and into your session is a salted hash of it, which cannot be turned back into the number",
      "The site shows a masked number anywhere a number appears, so the person holding a token's fees is identifiable to themselves and to nobody else",
    ],
  },
  {
    id: "flow",
    title: "From a message to a wallet",
    body: [
      "The whole path, end to end. Everything before the claim happens without you doing anything",
    ],
    figure: "flow",
  },
  {
    id: "trouble",
    title: "If something looks wrong",
    body: [
      "Reply in the same thread. The number that launched the coin is enough to identify it, no ticket number and no reference needed",
      "If a claim fails, nothing has moved. The amount stays where it was and you can try again",
    ],
  },
];

export default function DocsPage() {
  return (
    <section className="mx-auto w-full px-4 pt-10 pb-16 lg:px-8 xl:max-w-4xl">
      <span className="text-xs tracking-wide text-secondary">Docs</span>

      <h1 className="animate-section-in font-display mt-2 text-4xl font-normal tracking-tight text-primary sm:text-5xl">
        How Fornum works
      </h1>

      <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-secondary">
        One message launches a token. Its creator fees are split on chain the
        moment it is made, eighty percent to you, and you claim your share here
        with the number you sent the message from
      </p>

      <nav className="mt-10" aria-label="Contents">
        <span className="text-[10px] tracking-[0.1em] text-secondary/60 uppercase">
          Contents
        </span>
        <ol className="mt-4 grid gap-x-12 gap-y-2.5 sm:grid-cols-2">
          {SECTIONS.map((s, i) => (
            <li key={s.id} className="flex gap-4 text-sm">
              <span className="tnum w-4 shrink-0 text-right text-secondary/60">
                {i + 1}
              </span>
              <a
                href={`#${s.id}`}
                className="text-secondary transition-colors hover:text-primary"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-14 flex flex-col gap-12">
        {SECTIONS.map((s, i) => (
          <article
            key={s.id}
            id={s.id}
            className="animate-section-in flex scroll-mt-24 gap-4 sm:gap-6"
            style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
          >
            <span className="tnum w-4 shrink-0 pt-1 text-right text-sm text-secondary/60">
              {i + 1}
            </span>

            <div className="flex min-w-0 flex-col gap-3">
              <h2 className="font-display text-xl font-normal text-primary">
                {s.title}
              </h2>

              {s.body.map((p) => (
                <p
                  key={p.slice(0, 24)}
                  className="max-w-[62ch] text-base leading-relaxed text-secondary"
                >
                  {p}
                </p>
              ))}

              {s.figure === "split" && <SplitFigure />}
              {s.figure === "flow" && <FlowFigure />}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Eighty twenty, drawn to scale so the numbers are not the only thing saying it */
function SplitFigure() {
  return (
    <div className="mt-2 max-w-[36rem]">
      <div className="flex h-14 overflow-hidden rounded-xl border border-primary/[0.06]">
        <div className="flex flex-[4] flex-col justify-center bg-brand/15 px-4">
          <span className="tnum text-base font-bold text-brand">80%</span>
          <span className="text-[11px] text-secondary">yours</span>
        </div>
        <div className="flex flex-1 flex-col justify-center border-l border-primary/[0.06] bg-card px-4">
          <span className="tnum text-base font-bold text-primary">20%</span>
          <span className="text-[11px] text-secondary">Fornum</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-secondary">
        Locked on chain at launch, unchangeable afterwards by anyone
      </p>
    </div>
  );
}

/**
 * The five stages, as a rail rather than a picture of a rail
 *
 * The dot and the line share a grid column, and the line is drawn per step
 * rather than behind the whole list, so it starts at the first dot and stops
 * at the last one without any offsets to keep in sync
 */
function FlowFigure() {
  return (
    <ol className="mt-2 flex flex-col">
      {FLOW.map((n, i) => (
        <li key={n.label} className="grid grid-cols-[0.5rem_1fr] gap-x-5">
          <div className="flex flex-col items-center">
            <span
              className="animate-breathe motion-reduce:animate-none mt-1.5 size-2 shrink-0 rounded-full bg-brand"
              style={{ animationDelay: `${i * 240}ms` }}
            />
            {i < FLOW.length - 1 && (
              <span className="w-px flex-1 bg-primary/[0.1]" />
            )}
          </div>

          <div className={i < FLOW.length - 1 ? "pb-5" : undefined}>
            <span className="block text-sm font-bold text-primary">
              {n.label}
            </span>
            <span className="block text-xs text-secondary">{n.sub}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
