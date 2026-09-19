"use client";

import { useState } from "react";
import { Card } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

type Mode = "grant" | "revoke";
type Stage = "idle" | "sent" | "done";

export function ConsentForm() {
  const [mode, setMode] = useState<Mode>("revoke");
  const [stage, setStage] = useState<Stage>("idle");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  const ready = phone.replace(/\D/g, "").length >= 10;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (stage === "idle" && ready) setStage("sent");
    else if (stage === "sent" && code.length >= 4) setStage("done");
  }

  function reset() {
    setStage("idle");
    setPhone("");
    setCode("");
  }

  return (
    <div className="flex flex-col gap-3">
      <Card sheen className="animate-section-in flex flex-col gap-5 p-6">
        <Segmented<Mode>
          value={mode}
          onChange={(next) => {
            setMode(next);
            reset();
          }}
          options={[
            { id: "revoke", label: "Stop calls" },
            { id: "grant", label: "Allow calls" },
          ]}
        />

        {stage === "done" ? (
          <div className="animate-scale-in motion-reduce:animate-none flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand/15">
              <CheckIcon className="size-7 text-brand" />
            </span>
            <span className="text-lg font-bold text-primary">
              {mode === "revoke" ? "Consent revoked" : "Number confirmed"}
            </span>
            <p className="max-w-[46ch] text-sm text-secondary">
              {mode === "revoke"
                ? "No more calls will go to this number. Fees pointed at it stay in escrow until the launcher names a new one"
                : "Fees pointed at this number can now be delivered. You can stop calls again at any time from this page"}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-2 flex h-10 items-center rounded-full border px-5 text-sm font-bold text-primary transition-colors hover:bg-background/70"
            >
              Another number
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-[10px] font-bold tracking-wider text-secondary">
                WHATSAPP NUMBER
              </span>
              <span className="relative flex h-11 items-center">
                <WhatsAppIcon className="absolute left-4 size-4 text-brand" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={stage === "sent"}
                  inputMode="tel"
                  placeholder="+1 415 555 77 12"
                  className="tnum h-11 w-full rounded-full border border-primary/[0.06] bg-field pr-4 pl-11 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
                />
              </span>
            </label>

            {stage === "sent" && (
              <label className="animate-fade-slide-up motion-reduce:animate-none flex flex-col gap-2">
                <span className="text-[10px] font-bold tracking-wider text-secondary">
                  CODE FROM THE MESSAGE
                </span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  className="tnum h-11 w-full max-w-[200px] rounded-full border border-primary/[0.06] bg-field px-5 text-center text-lg tracking-[0.4em] text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                />
                <span className="text-xs text-secondary">
                  Sent to {phone}, it proves the number is yours
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={stage === "idle" ? !ready : code.length < 4}
              className={cn(
                "flex h-11 w-fit items-center rounded-full px-6 text-sm font-bold transition-colors",
                "bg-primary text-background hover:bg-primary-hover",
                "disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              {stage === "idle"
                ? "Send code"
                : mode === "revoke"
                  ? "Stop calls to this number"
                  : "Confirm this number"}
            </button>
          </form>
        )}
      </Card>

      <Card
        className="animate-section-in flex flex-col gap-2 p-5 text-sm text-secondary"
        style={{ animationDelay: "60ms" }}
      >
        <span className="text-sm font-bold text-primary">
          What we do with the number
        </span>
        <p>
          Only a salted hash of it goes on chain. The mapping lives off chain
          and is handed to whoever places the call, for the length of that call
        </p>
        <p>
          A number without active consent is never dialed, even when fees are
          already sitting in escrow for it
        </p>
      </Card>
    </div>
  );
}
