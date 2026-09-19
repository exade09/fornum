import type { Metadata } from "next";
import { Card } from "@/components/ui/primitives";
import { ACCOUNT_LAYOUT } from "@/lib/data";

/** The path a launch takes, from a message to money in a wallet */
const FLOW = [
  { x: 60, label: "Message", sub: "name, ticker, picture" },
  { x: 250, label: "Launch", sub: "deployed on pump.fun" },
  { x: 440, label: "Trading", sub: "creator fees build up" },
  { x: 630, label: "Sign in", sub: "same number, on the site" },
  { x: 820, label: "Claim", sub: "fees to your wallet" },
];

export const metadata: Metadata = { title: "Docs" };

const SECTIONS = [
  {
    t: "What Fornum does",
    d: "You send a message on WhatsApp with a name, a ticker and a picture. We deploy that token on pump.fun from a Fornum launch wallet and send the mint address back in the same thread. The creator fees the token earns are yours, and you take them from this site",
  },
  {
    t: "Why the token has to come from here",
    d: "Creator fees go wherever the mint was configured to send them, and that is fixed at launch. A token deployed somewhere else pays its fees somewhere else, so there is nothing for us to hold for you. That is why every token on the site went through the thread",
  },
  {
    t: "Launching",
    d: "Text LAUNCH to the number on the home page. Send the name, the ticker and the picture as a photo, not as a link. A person reads it, deploys the token and replies with the mint address. It usually takes a couple of minutes",
  },
  {
    t: "Where the fees sit",
    d: "On the launch wallet that deployed your mint. They are recorded against the number the launch came from, so the site can show exactly what is yours and what is left to take",
  },
  {
    t: "Claiming",
    d: "Sign in with the number you launched from, open your token and paste a Solana address. The claim sends what has accrued to that address and leaves a transaction on the token page",
  },
  {
    t: "Handing the fees to somebody else",
    d: "On the token page you can point the fees at another WhatsApp number. From that moment everything the token earns, including what is unclaimed, belongs to that number and only they can take it. It cannot be undone",
  },
  {
    t: "What it costs",
    d: "Launching is free for you. Fornum keeps a share of the creator fees, the rest is yours. Network fees come out of the claim itself",
  },
  {
    t: "Privacy",
    d: "Only a salted hash of the number is written on chain. The mapping between hash and number stays off chain, and the site never shows a full number to anyone but its owner",
  },
];

export default function DocsPage() {
  return (
    <section className="mx-auto w-full px-4 pt-8 pb-10 lg:px-6 xl:max-w-4xl">
      <span className="text-sm text-secondary">Docs</span>
      <h1 className="animate-section-in font-display mt-1 text-3xl font-normal tracking-tight text-primary sm:text-4xl">
        How Fornum works
      </h1>
      <p className="mt-4 max-w-[68ch] text-base text-secondary">
        One message launches a token, and the fees it earns stay yours. Below is
        the detail behind that sentence
      </p>

      <nav className="mt-8">
        <span className="text-[10px] font-bold tracking-wider text-secondary">
          CONTENTS
        </span>
        <ol className="mt-3 grid gap-x-10 gap-y-2 sm:grid-cols-2">
          {SECTIONS.map((s, i) => (
            <li key={s.t} className="flex gap-3 text-sm">
              <span className="tnum w-4 shrink-0 text-secondary">{i + 1}</span>
              <a
                href={`#s${i + 1}`}
                className="text-primary/80 transition-colors hover:text-primary"
              >
                {s.t}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 flex flex-col gap-8">
        {SECTIONS.map((s, i) => (
          <article
            key={s.t}
            id={`s${i + 1}`}
            className="animate-section-in flex gap-4"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="tnum w-4 shrink-0 pt-1 text-sm text-secondary">
              {i + 1}
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-primary">{s.t}</h2>
              <p className="max-w-[68ch] text-sm text-secondary">{s.d}</p>
            </div>
          </article>
        ))}

        <article className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-primary">
            From a message to a wallet
          </h2>
          <Card sheen className="overflow-x-auto p-5">
            <svg
              viewBox="0 0 900 160"
              className="h-40 w-full min-w-[840px]"
              role="img"
              aria-label="Message, launch, trading, sign in, claim"
            >
              {FLOW.slice(0, -1).map((n, i) => (
                <line
                  key={i}
                  x1={n.x + 28}
                  y1={62}
                  x2={FLOW[i + 1].x - 28}
                  y2={62}
                  className="animate-dash motion-reduce:animate-none"
                  stroke="hsl(var(--primary) / 0.28)"
                  strokeWidth="1.5"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}

              {FLOW.map((n, i) => (
                <g key={n.label}>
                  <circle
                    cx={n.x}
                    cy={62}
                    r={26}
                    fill="hsl(var(--background))"
                    stroke="hsl(var(--primary) / 0.16)"
                  />
                  <circle
                    cx={n.x}
                    cy={62}
                    r={6}
                    fill="hsl(var(--brand))"
                    className="animate-breathe motion-reduce:animate-none"
                    style={{ animationDelay: `${i * 240}ms` }}
                  />
                  <text
                    x={n.x}
                    y={108}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="hsl(var(--primary))"
                  >
                    {n.label}
                  </text>
                  <text
                    x={n.x}
                    y={126}
                    textAnchor="middle"
                    fontSize="10"
                    fill="hsl(var(--secondary))"
                  >
                    {n.sub}
                  </text>
                </g>
              ))}
            </svg>
          </Card>
        </article>

        <article className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-primary">Token account</h2>
          <p className="max-w-[68ch] text-sm text-secondary">
            One account per launched mint, holding what was collected, what was
            claimed and the hash of the number it belongs to
          </p>
          <div className="overflow-hidden rounded-xl border border-primary/[0.06] bg-card font-mono text-xs">
            <div className="flex gap-4 border-b border-primary/[0.06] px-4 py-2 text-[10px] text-secondary">
              <span className="w-10">OFF</span>
              <span className="w-10">LEN</span>
              <span>FIELD</span>
            </div>
            {ACCOUNT_LAYOUT.map((r) => (
              <div
                key={r.off}
                className="flex gap-4 px-4 py-1.5 text-primary/80"
              >
                <span className="tnum w-10 text-secondary">{r.off}</span>
                <span className="tnum w-10 text-secondary">{r.len}</span>
                <span>{r.field}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
