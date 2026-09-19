import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Field, Progress, TokenChip } from "@/components/ui/primitives";
import { TokenMark } from "@/components/ui/token-mark";
import { ClaimPanel } from "@/components/token/claim-panel";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  WhatsAppIcon,
} from "@/components/icons";
import {
  TOKENS,
  claimable,
  claimsForToken,
  compactUsd,
  feeRecipient,
  getToken,
  num,
  usd,
} from "@/lib/data";
import { readSession } from "@/lib/auth/session";

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

export default async function TokenPage({ params }: PageProps<"/token/[id]">) {
  const { id } = await params;
  const t = getToken(id);
  if (!t) notFound();

  const session = await readSession();
  const recipient = feeRecipient(t);
  const left = claimable(t);
  const claims = claimsForToken(t.id);
  const claimedRatio = t.feesAccrued > 0 ? t.feesClaimed / t.feesAccrued : 0;

  return (
    <div className="mx-auto flex w-full flex-col gap-3 px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
      <Link
        href="/tokens"
        className="group flex w-fit items-center gap-1 text-sm text-secondary transition-colors hover:text-primary"
      >
        <ChevronLeftIcon className="size-4 transition-transform group-hover:-translate-x-0.5" />
        Back to tokens
      </Link>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3">
          <Card
            sheen
            className="animate-section-in flex items-center gap-4 p-5"
          >
            <TokenMark symbol={t.symbol} size="xl" className="size-16" />
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-xl font-bold text-primary">
                  {t.symbol}
                </span>
                <TokenChip status={t.status} />
              </div>
              <span className="truncate text-sm text-secondary">{t.name}</span>
              <a
                href={`https://pump.fun/${t.mint}`}
                target="_blank"
                rel="noreferrer"
                className="group mt-1 flex w-fit items-center gap-1 font-mono text-[11px] text-secondary transition-colors hover:text-primary"
              >
                {t.mint.slice(0, 10)}…{t.mint.slice(-8)}
                <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
              </a>
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

          <Card
            sheen
            className="animate-section-in flex flex-col gap-5 p-6"
            style={{ animationDelay: "60ms" }}
          >
            <div className="flex flex-wrap items-end gap-x-12 gap-y-5">
              <Field
                label="Fees collected"
                value={usd(t.feesAccrued, 0)}
                accent="brand"
              />
              <Field label="Already claimed" value={usd(t.feesClaimed, 0)} />
              <Field
                label="Left to claim"
                value={usd(left, 0)}
                accent="queued"
              />
              <Field label="Holders" value={num(t.holders)} />
            </div>
            <Progress value={claimedRatio} />
            <span className="text-xs text-secondary">
              Launched {t.launchedAgo} from{" "}
              <span className="tnum text-primary/80">{t.owner}</span>
              {t.assignedTo ? (
                <>
                  , fees handed to{" "}
                  <span className="tnum text-primary/80">{t.assignedTo}</span>
                </>
              ) : null}
            </span>
          </Card>

          <Card
            className="animate-section-in flex flex-col gap-3 p-5"
            style={{ animationDelay: "120ms" }}
          >
            <span className="text-sm font-bold text-primary">
              Claim history
            </span>
            {claims.length === 0 && (
              <span className="text-xs text-secondary">
                Nothing claimed yet
              </span>
            )}
            {claims.map((c, i) => (
              <a
                key={c.id}
                href={`https://solscan.io/tx/${c.tx}`}
                target="_blank"
                rel="noreferrer"
                className="animate-card-in motion-reduce:animate-none group flex items-center gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-background/70"
                style={{ animationDelay: `${160 + i * 55}ms` }}
              >
                <span className="tnum text-sm font-bold text-primary">
                  {usd(c.amount, 0)}
                </span>
                <span className="truncate font-mono text-xs text-secondary">
                  {c.wallet}
                </span>
                <span className="tnum ml-auto text-xs text-secondary">
                  {c.ago}
                </span>
                <ArrowRightIcon className="size-3 text-secondary opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </Card>
        </div>

        <div className="animate-section-in flex flex-col gap-3">
          <ClaimPanel
            amount={left}
            recipient={recipient}
            signedIn={Boolean(session)}
            canClaim={session?.masked === recipient}
          />

          <Card className="flex flex-col gap-2 p-5 text-xs text-secondary">
            <span className="text-sm font-bold text-primary">
              How the fees got here
            </span>
            <p>
              The mint was deployed from a Fornum launch wallet, so pump.fun
              pays its creator fees to us
            </p>
            <p className="flex items-center gap-1.5">
              <WhatsAppIcon className="size-3.5 shrink-0 text-brand" />
              They belong to the number that asked for the launch, and only that
              number can move them
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
