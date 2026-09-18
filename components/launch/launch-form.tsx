"use client";

import { useState } from "react";
import { CheckIcon, PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { Card } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { TokenMark } from "@/components/ui/token-mark";
import { Waveform } from "@/components/ui/waveform";
import { cn } from "@/lib/cn";

type Mode = "new" | "existing";
type Agent = "bot" | "operator";

const AGENTS: { id: Agent; label: string; price: string }[] = [
  { id: "bot", label: "Recorded voice", price: "$0.40 a call" },
  { id: "operator", label: "Live operator", price: "$1.20 a call" },
];

export function LaunchForm() {
  const [mode, setMode] = useState<Mode>("new");
  const [agent, setAgent] = useState<Agent>("bot");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [mint, setMint] = useState("");
  const [phone, setPhone] = useState("");

  const digits = phone.replace(/\D/g, "").length;
  const phoneReady = digits >= 10;
  const ready =
    phoneReady && (mode === "new" ? name.length > 1 && symbol.length > 1 : mint.length > 30);

  const previewSymbol = symbol.trim() || "NEW";

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card sheen className="animate-section-in flex flex-col gap-6 p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-normal text-primary">
            Launch a token
          </h2>
          <p className="text-sm text-secondary">
            We deploy the mint with the Fornum treasury as fee recipient, so
            every creator fee has somewhere to go
          </p>
        </div>

        <Segmented<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { id: "new", label: "New token" },
            { id: "existing", label: "Token I already launched" },
          ]}
        />

        {mode === "new" ? (
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <TokenMark
                symbol={previewSymbol}
                size="xl"
                className="size-[72px]"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-secondary">
                    NAME
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ledger Cat"
                    maxLength={32}
                    className="h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold tracking-wider text-secondary">
                    TICKER
                  </span>
                  <input
                    value={symbol}
                    onChange={(e) =>
                      setSymbol(e.target.value.toUpperCase().slice(0, 10))
                    }
                    placeholder="LCAT"
                    className="h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 text-sm text-primary uppercase placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                  />
                </label>
              </div>
            </div>
            <p className="text-xs text-secondary">
              Skip the image and we draw a mark from your ticker, you can
              replace it later
            </p>
          </div>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              MINT ADDRESS
            </span>
            <input
              value={mint}
              onChange={(e) => setMint(e.target.value)}
              placeholder="7GkQmARuK3xy9pLd2V8sNfTcH1bZoW4eXjMv6RsUq5Yn"
              className="h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 font-mono text-xs text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
            <span className="text-xs text-secondary">
              Works only if the mint already points its creator fees at the
              Fornum treasury, otherwise there is nothing for us to claim
            </span>
          </label>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-bold tracking-wider text-secondary">
            SEND FEES TO
          </span>
          <span className="relative flex h-11 items-center">
            <WhatsAppIcon className="absolute left-4 size-4 text-brand" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="+1 415 555 77 12"
              className="tnum h-11 w-full rounded-full border border-primary/[0.06] bg-field pr-4 pl-11 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs",
              phoneReady ? "text-brand" : "text-secondary",
            )}
          >
            {phoneReady && <CheckIcon className="size-3.5" />}
            {phoneReady
              ? "We send a confirmation to this number first, nothing is called before the owner agrees"
              : "The owner of this number confirms it once, and can pull consent at any time"}
          </span>
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-[10px] font-bold tracking-wider text-secondary">
            WHO MAKES THE CALL
          </legend>
          <div className="flex flex-wrap gap-2">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAgent(a.id)}
                aria-pressed={agent === a.id}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                  agent === a.id
                    ? "border-primary/30 bg-background/70 text-primary"
                    : "border-primary/[0.06] text-secondary hover:text-primary",
                )}
              >
                <PhoneIcon
                  className={cn(
                    "size-4",
                    agent === a.id ? "text-brand" : "text-secondary",
                  )}
                />
                {a.label}
                <span className="tnum text-xs text-secondary">{a.price}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <button
          type="button"
          disabled={!ready}
          className="flex h-11 w-fit items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mode === "new" ? "Deploy and route fees" : "Route fees"}
        </button>
      </Card>

      <aside className="flex h-fit flex-col gap-3">
        <Card
          sheen
          className="animate-scale-in motion-reduce:animate-none flex flex-col gap-3 p-4"
        >
          <span className="text-[10px] font-bold tracking-wider text-secondary">
            WHAT THE RECIPIENT HEARS
          </span>

          <div className="flex items-center gap-3">
            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/15">
              <span className="animate-ring-pulse motion-reduce:animate-none absolute size-10 rounded-full bg-brand/40" />
              <PhoneIcon className="size-5 text-brand" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold text-primary">
                Incoming call
              </span>
              <span className="tnum truncate text-xs text-secondary">
                {phone || "+1 415 555 77 12"}
              </span>
            </div>
          </div>

          <p className="text-xs text-secondary">
            Your token {previewSymbol} earned creator fees on Fornum. Confirm
            this number and we send them over
          </p>

          <Waveform className="h-8" bars={28} />
        </Card>

        <Card className="flex flex-col gap-3 p-4">
          <span className="text-sm font-bold text-primary">Next steps</span>
          <ol className="flex flex-col gap-2 text-xs text-secondary">
            {[
              "Mint is deployed with our treasury as fee recipient",
              "Number gets a confirmation message and agrees once",
              "Fees build up as people trade the token",
              `${agent === "operator" ? "An operator" : "A recorded voice"} calls, then the payout is sent`,
            ].map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="tnum shrink-0 text-primary/70">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      </aside>
    </div>
  );
}
