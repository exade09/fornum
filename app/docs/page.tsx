import type { Metadata } from "next";
import { Card } from "@/components/ui/primitives";
import { ACCOUNT_LAYOUT } from "@/lib/data";

/** The path a launch takes, each node is one instruction in the program */
const FLOW = [
  { x: 60, label: "Launch", sub: "mint deployed here" },
  { x: 230, label: "Trading", sub: "creator fees build up" },
  { x: 400, label: "Claim", sub: "fees pulled on chain" },
  { x: 570, label: "Consent", sub: "number confirms once" },
  { x: 740, label: "Call", sub: "voice or operator" },
  { x: 910, label: "Payout", sub: "dollars on the phone" },
];

export const metadata: Metadata = { title: "Docs" };

const SECTIONS = [
  {
    t: "What Fornum does",
    d: "Fornum deploys your token on Solana with our treasury set as the creator fee recipient. As people trade it, fees build up. We claim them, call the number you named, and send the money in dollars once the owner confirms",
  },
  {
    t: "Why the token has to come from here",
    d: "Creator fees go wherever the mint was configured to send them, and that is fixed at launch. A token deployed somewhere else pays its fees somewhere else, so there is nothing for us to claim and nobody on file to pay. That is why every token on the site was launched through Fornum",
  },
  {
    t: "Launching",
    d: "Pick a name and a ticker, add an image if you have one, and enter the WhatsApp number the fees should reach. We deploy the mint and write the number, hashed, into the token account",
  },
  {
    t: "Already launched somewhere else",
    d: "You can point an existing mint at us only if its fee recipient is already the Fornum treasury. If it is not, the fees are not ours to claim and the form will tell you so",
  },
  {
    t: "Confirming the number",
    d: "The owner of the number gets one message and confirms once. Until that happens the fees sit in escrow. Consent can be pulled at any time on the consent page, which drops every pending call to that number",
  },
  {
    t: "The call",
    d: "A recorded voice reads the payout message, or a live operator does it for a higher rate. Either way the script is stored with the token and shown on its page, so anyone can read what was said",
  },
  {
    t: "The queue",
    d: "Calls run one at a time. Your position is a field in the token account, so the number on the site is the number in the program. It moves as calls ahead of you finish",
  },
  {
    t: "Getting paid",
    d: "After a confirmed call the escrow releases and the payout goes out in dollars. Each payout leaves a receipt you can open from the payouts page",
  },
  {
    t: "If nobody answers",
    d: "We retry, then stop. Fees that cannot be delivered stay in escrow and the launcher can point them at a different number or withdraw them",
  },
  {
    t: "Privacy",
    d: "Only a salted hash of the number goes on chain. The mapping between hash and number lives off chain and is handed to whoever places the call, for the length of that call",
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
        Launch a token here, name one WhatsApp number, and its creator fees end
        up on that phone. Everything below is the detail behind that sentence
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
            Where the money goes
          </h2>
          <p className="max-w-[68ch] text-sm text-secondary">
            Nothing moves until the number confirms and the call goes through
          </p>
          <Card sheen className="overflow-x-auto p-5">
            <svg
              viewBox="0 0 990 160"
              className="h-40 w-full min-w-[900px]"
              role="img"
              aria-label="Launch, trading, claim, consent, call, payout"
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
            One account per launched mint. The queue index and the status live
            here too, which is why the site and the program always agree
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
