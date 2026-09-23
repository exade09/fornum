"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/primitives";
import { Segmented } from "@/components/ui/segmented";
import { CheckIcon, PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

type Channel = "whatsapp" | "sms";
type Stage = "phone" | "code" | "done";

export function SignInForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [masked, setMasked] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const phoneReady = phone.replace(/\D/g, "").length >= 8;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneReady || busy) return;

    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, channel }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not send the code");
      return;
    }
    setStage("code");
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 4 || busy) return;

    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Wrong code");
      return;
    }

    const body = (await res.json()) as { masked: string };
    setMasked(body.masked);
    setStage("done");
    router.refresh();
  }

  if (stage === "done") {
    return (
      <Card
        sheen
        className="animate-scale-in motion-reduce:animate-none flex flex-col items-center gap-3 p-8 text-center"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-brand/15">
          <CheckIcon className="size-7 text-brand" />
        </span>
        <span className="text-lg font-bold text-primary">
          You are signed in
        </span>
        <p className="tnum max-w-[44ch] text-sm text-secondary">
          {masked} is confirmed. Fees pointed at this number can be claimed
          from the token page
        </p>
      </Card>
    );
  }

  return (
    <Card sheen className="animate-section-in flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-xl font-normal text-primary">
          Sign in with your number
        </h2>
        <p className="text-sm text-secondary">
          One code, no password. The same number receives the fees from tokens
          you launch
        </p>
      </div>

      {stage === "phone" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-5">
          <Segmented<Channel>
            value={channel}
            onChange={setChannel}
            options={[
              { id: "whatsapp", label: "WhatsApp" },
              { id: "sms", label: "SMS" },
            ]}
          />

          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              PHONE NUMBER
            </span>
            <span className="relative flex h-11 items-center">
              {channel === "whatsapp" ? (
                <WhatsAppIcon className="absolute left-4 size-4 text-brand" />
              ) : (
                <PhoneIcon className="absolute left-4 size-4 text-brand" />
              )}
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="+1 415 555 77 12"
                className="tnum h-11 w-full rounded-full border border-primary/[0.06] bg-field pr-4 pl-11 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              />
            </span>
            <span className="text-xs text-secondary">
              Include the country code. We send one code and nothing else
            </span>
          </label>

          {error && <p className="text-xs text-error">{error}</p>}

          <button
            type="submit"
            disabled={!phoneReady || busy}
            className="flex h-11 w-fit items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Sending" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={confirm} className="flex flex-col gap-5">
          <label className="animate-fade-slide-up motion-reduce:animate-none flex flex-col gap-2">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              CODE FROM {channel === "whatsapp" ? "WHATSAPP" : "SMS"}
            </span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              className="tnum h-12 w-full max-w-[220px] rounded-full border border-primary/[0.06] bg-field px-5 text-center text-lg tracking-[0.4em] text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
            <span className="tnum text-xs text-secondary">Sent to {phone}</span>
          </label>

          {!configured && (
            <p className="rounded-lg border border-queued/25 bg-queued/[0.07] px-3 py-2 text-xs text-queued">
              No provider connected yet, so nothing was actually sent. Use
              000000 to walk through the flow
            </p>
          )}

          {error && <p className="text-xs text-error">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={code.length < 4 || busy}
              className="flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Checking" : "Confirm"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStage("phone");
                setCode("");
                setError("");
              }}
              className={cn(
                "text-sm text-secondary transition-colors hover:text-primary",
              )}
            >
              Change number
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
