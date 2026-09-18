import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CallChip,
  Field,
  Progress,
  TokenChip,
} from "@/components/ui/primitives";
import { TokenMark, WalletMark } from "@/components/ui/token-mark";
import { Waveform } from "@/components/ui/waveform";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  PhoneIcon,
  WhatsAppIcon,
} from "@/components/icons";
import {
  TOKENS,
  callsForToken,
  compactUsd,
  getToken,
  num,
  usd,
} from "@/lib/data";
import { cn } from "@/lib/cn";

export function generateStaticParams() {
  return TOKENS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/token/[id]">): Promise<Metadata> {
  const { id } = await params;
  const t = getToken(id);
  return { title: t ? `${t.symbol}, ${t.name}` : "Token" };
}

/** Lifecycle of one token, each step maps to an instruction in the program */
const STEPS = [
  { label: "Mint deployed", hint: "launch_token" },
  { label: "Number confirmed", hint: "confirm_recipient" },
  { label: "Fees claimed", hint: "claim_fees" },
  { label: "Call placed", hint: "place_call" },
  { label: "Payout sent", hint: "settle" },
];

export default async function TokenPage({ params }: PageProps<"/token/[id]">) {
  const { id } = await params;
  const t = getToken(id);
  if (!t) notFound();

  const calls = callsForToken(t.id);
  const paidRatio = t.feesClaimed > 0 ? t.feesPaid / t.feesClaimed : 0;

  // how far this token got, derived from what actually happened to it
  let reached = 1;
  if (t.recipientConfirmed) reached = 2;
  if (t.feesClaimed > 0 && t.recipientConfirmed) reached = 3;
  if (calls.some((c) => c.status === "answered")) reached = 4;
  if (t.feesPaid > 0) reached = 5;

  return (
    <div className="mx-auto flex w-full flex-col gap-3 px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
      <Link
        href="/tokens"
        className="group flex w-fit items-center gap-1 text-sm text-secondary transition-colors hover:text-primary"
      >
        <ChevronLeftIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Back to tokens
      </Link>

      <div className="animate-section-in grid gap-3 lg:grid-cols-2">
        <Card sheen className="flex items-center gap-4 p-5">
          <TokenMark symbol={t.symbol} size="xl" className="size-14" />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-lg font-bold text-primary">
                {t.symbol}
              </span>
              <TokenChip status={t.status} />
            </div>
            <span className="truncate text-sm text-secondary">{t.name}</span>
          </div>
          <div className="ml-auto flex flex-col items-end">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              MARKET CAP
            </span>
            <span className="tnum text-xl font-bold text-primary">
              {compactUsd(t.marketCap)}
            </span>
          </div>
        </Card>

        <Card sheen className="flex items-center gap-4 p-5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand/15">
            <WhatsAppIcon className="size-7 text-brand" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="tnum truncate text-lg font-bold text-primary">
              {t.recipient}
            </span>
            <span className="flex items-center gap-1 text-sm text-secondary">
              {t.recipientConfirmed ? (
                <>
                  <CheckIcon className="size-3.5 text-brand" />
                  Consent on file
                </>
              ) : (
                "Waiting for the owner to confirm"
              )}
            </span>
          </div>
          <div className="ml-auto flex flex-col items-end">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              PAID OUT
            </span>
            <span className="tnum text-xl font-bold text-brand">
              {usd(t.feesPaid, 0)}
            </span>
          </div>
        </Card>
      </div>

      <Card
        sheen
        className="animate-section-in flex flex-col gap-5 p-6"
        style={{ animationDelay: "60ms" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-secondary">
            Launched {t.launchedAgo} by
          </span>
          <Link
            href={`/u/${t.creator.replace(/[^A-Za-z0-9]/g, "")}`}
            className="group flex items-center gap-2 text-sm font-bold text-primary"
          >
            <WalletMark address={t.creator} className="size-6" />
            {t.creator}
            <ArrowRightIcon className="size-3 text-secondary transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="flex flex-wrap items-end gap-x-12 gap-y-5">
          <Field
            label="Fees claimed"
            value={usd(t.feesClaimed, 0)}
            accent="brand"
          />
          <Field
            label="Still to send"
            value={usd(t.feesClaimed - t.feesPaid, 0)}
            accent="queued"
          />
          <Field label="Holders" value={num(t.holders)} />
          <Field
            label="Calls made"
            value={`${t.answered} of ${t.calls}`}
            accent="dialing"
          />
        </div>

        <Progress value={paidRatio} />
      </Card>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card
          sheen
          className="animate-section-in flex flex-col gap-1 p-6"
          style={{ animationDelay: "120ms" }}
        >
          <h2 className="mb-3 text-sm font-bold text-primary">Where it stands</h2>

          {STEPS.map((step, i) => {
            const done = i < reached;
            const active = i === reached;
            const last = i === STEPS.length - 1;

            return (
              <div key={step.hint} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "relative flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                      done && "border-brand bg-brand/15 text-brand",
                      active && "border-dialing bg-dialing/15 text-dialing",
                      !done && !active && "border-primary/10 text-secondary",
                    )}
                  >
                    {active && (
                      <span className="animate-ring-pulse motion-reduce:animate-none absolute size-6 rounded-full bg-dialing/40" />
                    )}
                    {done ? (
                      <CheckIcon className="size-3.5" />
                    ) : (
                      <span className="tnum text-[10px]">{i + 1}</span>
                    )}
                  </span>
                  {!last && (
                    <span
                      className={cn(
                        "w-px flex-1",
                        done ? "bg-brand/40" : "bg-primary/10",
                      )}
                    />
                  )}
                </div>

                <div className={cn("flex flex-col pb-6", last && "pb-0")}>
                  <span
                    className={cn(
                      "text-sm",
                      done || active
                        ? "font-bold text-primary"
                        : "text-secondary",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="font-mono text-[11px] text-secondary">
                    {step.hint}
                  </span>
                </div>
              </div>
            );
          })}
        </Card>

        <div className="flex flex-col gap-3">
          {calls.map((c, i) => (
            <Card
              key={c.id}
              sheen
              className="animate-section-in flex flex-col gap-3 p-5"
              style={{ animationDelay: `${160 + i * 60}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/15">
                  {c.status === "dialing" && (
                    <span className="animate-ring-pulse motion-reduce:animate-none absolute size-10 rounded-full bg-brand/40" />
                  )}
                  <PhoneIcon className="size-5 text-brand" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-bold text-primary">
                    {c.kind === "payout" ? "Payout call" : "Holder alert"}
                  </span>
                  <span className="text-xs text-secondary">
                    {c.agent === "operator" ? "live operator" : "recorded voice"}
                    {c.duration ? `, ${c.duration}` : ""}
                  </span>
                </div>
                <CallChip status={c.status} className="ml-auto" />
              </div>

              <p className="text-sm text-secondary">{c.script}</p>
              <Waveform
                className="h-9"
                paused={c.status !== "dialing"}
                bars={30}
              />
            </Card>
          ))}

          <Card className="animate-section-in flex flex-col gap-3 p-5">
            <span className="text-sm font-bold text-primary">On chain</span>
            <Row
              label="Mint"
              value={t.mint}
              href={`https://solscan.io/token/${t.mint}`}
            />
            <Row label="Creator" value={t.creator} />
            <Row label="Fee recipient" value="Fornum treasury" />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <span className="truncate font-mono text-xs text-primary/80 transition-colors group-hover:text-primary">
      {value}
    </span>
  );

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-secondary">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="group flex min-w-0 flex-1 items-center gap-1"
        >
          {body}
          <ArrowRightIcon className="size-3 shrink-0 text-secondary transition-colors group-hover:text-primary" />
        </a>
      ) : (
        <span className="min-w-0 flex-1">{body}</span>
      )}
    </div>
  );
}
