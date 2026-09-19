import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, StaleNotice } from "@/components/shell/page-hero";
import { Card, CallChip, Field } from "@/components/ui/primitives";
import { TokenMark } from "@/components/ui/token-mark";
import { Waveform } from "@/components/ui/waveform";
import { PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { CALLS, getStats, getToken, num } from "@/lib/data";

export const metadata: Metadata = { title: "Calls" };

export default function QueuePage() {
  const stats = getStats();
  const live = CALLS.filter((c) => c.status === "dialing");
  const waiting = CALLS.filter(
    (c) => c.status === "queued" || c.status === "verifying",
  ).sort((a, b) => a.position - b.position);
  const done = CALLS.filter(
    (c) => c.status === "answered" || c.status === "missed",
  );

  return (
    <>
      <PageHero
        eyebrow="Live"
        title="Call queue"
        description="Calls run one at a time. Your position comes from the program, so it is the same number everyone else sees"
      />

      <section className="mx-auto w-full px-4 pt-6 lg:px-6 xl:max-w-7xl">
        <Card
          sheen
          className="animate-section-in flex flex-wrap gap-x-12 gap-y-5 p-6"
        >
          <Field
            label="In queue"
            value={num(stats.callsInQueue)}
            accent="queued"
          />
          <Field
            label="On the line"
            value={num(stats.callsLive)}
            accent="dialing"
          />
          <Field
            label="Answer rate"
            value={`${stats.answerRatePct}%`}
            accent="brand"
          />
          <Field
            label="Tokens routing fees"
            value={num(stats.tokensLaunched)}
          />
        </Card>
      </section>

      {live.length > 0 && (
        <section className="mx-auto w-full px-4 pt-3 lg:px-6 xl:max-w-7xl">
          <h2 className="mb-3 text-sm font-bold text-primary">
            On the line now
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {live.map((c, i) => {
              const token = getToken(c.tokenId);
              return (
                <Card
                  key={c.id}
                  sheen
                  className="animate-section-in flex flex-col gap-4 p-5"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-brand/15">
                      <span className="animate-ring-pulse motion-reduce:animate-none absolute size-11 rounded-full bg-brand/40" />
                      <PhoneIcon className="size-5 text-brand" />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="tnum truncate text-base font-bold text-primary">
                        {c.phone}
                      </span>
                      <span className="truncate text-xs text-secondary">
                        {token?.symbol} fees,{" "}
                        {c.agent === "operator"
                          ? "live operator"
                          : "recorded voice"}
                      </span>
                    </div>
                    <CallChip status={c.status} className="ml-auto" />
                  </div>

                  <p className="text-sm text-secondary">{c.script}</p>
                  <Waveform className="h-9" bars={34} />
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <StaleNotice>
        Positions update as each call ends, no need to refresh
      </StaleNotice>

      <section className="mx-auto grid w-full gap-3 px-4 pt-4 pb-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-6 xl:max-w-7xl">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-primary">Next up</h2>
          {waiting.map((c, i) => {
            const token = getToken(c.tokenId);
            return (
              <Link
                key={c.id}
                href={`/token/${c.tokenId}`}
                className="animate-card-in motion-reduce:animate-none"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Card lift sheen className="flex items-center gap-3 px-4 py-3">
                  <span className="tnum flex size-9 shrink-0 items-center justify-center rounded-full bg-background/70 text-sm font-bold text-queued ring-1 ring-primary/[0.08]">
                    {c.position}
                  </span>
                  <TokenMark
                    symbol={token?.symbol ?? "?"}
                    size="md"
                    className="size-9"
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-bold text-primary">
                      {token?.symbol}
                    </span>
                    <span className="tnum truncate text-xs text-secondary">
                      {c.phone}
                    </span>
                  </div>
                  <CallChip status={c.status} className="ml-auto" />
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="animate-section-in flex h-fit flex-col gap-3 p-5">
          <span className="text-sm font-bold text-primary">Recent calls</span>
          {done.map((c, i) => {
            const token = getToken(c.tokenId);
            return (
              <div
                key={c.id}
                className="animate-card-in motion-reduce:animate-none flex items-center gap-3"
                style={{ animationDelay: `${i * 55}ms` }}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15">
                  <WhatsAppIcon className="size-4 text-brand" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-bold text-primary">
                    {token?.symbol}
                  </span>
                  <span className="tnum truncate text-[11px] text-secondary">
                    {c.duration ? `${c.duration} on the call` : "no answer"}
                  </span>
                </div>
                <span className="tnum ml-auto shrink-0 text-[11px] text-secondary">
                  {c.createdAgo}
                </span>
              </div>
            );
          })}
        </Card>
      </section>
    </>
  );
}
