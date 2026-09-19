import type { Metadata } from "next";
import { PageHero } from "@/components/shell/page-hero";
import { Card } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Flow" };

const NODES = [
  { x: 60, label: "Launch", sub: "mint deployed here" },
  { x: 230, label: "Trading", sub: "creator fees build up" },
  { x: 400, label: "Claim", sub: "fees pulled on chain" },
  { x: 570, label: "Consent", sub: "number confirms once" },
  { x: 740, label: "Call", sub: "voice or operator" },
  { x: 910, label: "Payout", sub: "dollars on the phone" },
];

const NOTES = [
  {
    t: "Why fees exist",
    d: "The mint is deployed with our treasury as fee recipient. That is set at launch and cannot drift later",
  },
  {
    t: "Why the call",
    d: "The call is how the recipient proves the number is theirs before money moves",
  },
  {
    t: "If it fails",
    d: "No consent or no answer means the fees stay in escrow, and the launcher can redirect or withdraw them",
  },
];

export default function FlowPage() {
  return (
    <>
      <PageHero
        eyebrow="Protocol"
        title="Where the money goes"
        description="Nothing moves until the number confirms and the call goes through. Each node below is one instruction in the program"
      />

      <section className="mx-auto w-full px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
        <Card sheen className="animate-section-in overflow-x-auto p-6">
          <svg
            viewBox="0 0 990 160"
            className="h-40 w-full min-w-[900px]"
            role="img"
            aria-label="Launch, trading, claim, consent, call, payout"
          >
            {NODES.slice(0, -1).map((n, i) => (
              <line
                key={i}
                x1={n.x + 28}
                y1={62}
                x2={NODES[i + 1].x - 28}
                y2={62}
                className="animate-dash motion-reduce:animate-none"
                stroke="hsl(var(--primary) / 0.28)"
                strokeWidth="1.5"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}

            {NODES.map((n, i) => (
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

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {NOTES.map((c, i) => (
            <Card
              key={c.t}
              lift
              sheen
              className="animate-card-in motion-reduce:animate-none flex flex-col gap-2 p-5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-sm font-bold text-primary">{c.t}</span>
              <p className="text-sm text-secondary">{c.d}</p>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
