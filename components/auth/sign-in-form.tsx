"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { WalletLinker } from "@/components/wallet/wallet-linker";
import { cn } from "@/lib/cn";

type Stage = "phone" | "send" | "wallet" | "done";

type Started = { code: string; message: string; link: string; stub: boolean };

const POLL_MS = 2000;

/**
 * Number, message, wallet
 *
 * The visitor types their number, sends the code it gives them from that
 * number on WhatsApp, and the page notices on its own. Then they link the
 * wallet their fees should go to, which is skipped when one is already linked
 */
export function SignInForm() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [started, setStarted] = useState<Started | null>(null);
  const [masked, setMasked] = useState("");
  const [wallet, setWallet] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const phoneReady = phone.replace(/\D/g, "").length >= 8;

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneReady || busy) return;

    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not start signing in");
      return;
    }
    setStarted((await res.json()) as Started);
    setStage("send");
  }

  // wait for the message to arrive at the webhook
  useEffect(() => {
    if (stage !== "send") return;
    let stopped = false;

    async function poll() {
      while (!stopped) {
        const res = await fetch("/api/auth/check", { method: "POST" }).catch(
          () => null,
        );
        if (stopped) return;

        if (res?.status === 200) {
          const body = (await res.json()) as { masked: string; wallet: string | null };
          setMasked(body.masked);
          setWallet(body.wallet);
          setStage(body.wallet ? "done" : "wallet");
          // the server would render the account card over the wallet step,
          // so the refresh waits until there is nothing left to do here
          if (body.wallet) router.refresh();
          return;
        }
        if (res?.status === 410) {
          setError("The code expired. Start again");
          setStage("phone");
          return;
        }
        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    }

    poll();
    return () => {
      stopped = true;
    };
  }, [stage, router]);

  if (stage === "done") {
    return (
      <Card
        sheen
        className="animate-scale-in motion-reduce:animate-none flex flex-col items-center gap-3 p-8 text-center"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-brand/15">
          <CheckIcon className="size-7 text-brand" />
        </span>
        <span className="text-lg font-bold text-primary">You are signed in</span>
        <p className="tnum max-w-[44ch] text-sm text-secondary">
          {masked} is confirmed and its fees go to the linked wallet. Claim them
          from the token page
        </p>
        <a
          href="/tokens"
          className="mt-2 flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
        >
          Find your token
        </a>
      </Card>
    );
  }

  return (
    <Card sheen className="animate-section-in flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-xl font-normal text-primary">
          {stage === "wallet" ? "Link your wallet" : "Sign in with your number"}
        </h2>
        <p className="text-sm text-secondary">
          {stage === "wallet"
            ? `${masked} is confirmed. Pick the wallet the fees should go to, you can change it later`
            : "No password and no code to wait for. You send one message from your WhatsApp and you are in"}
        </p>
      </div>

      {stage === "phone" && (
        <form onSubmit={start} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              PHONE NUMBER
            </span>
            <span className="relative flex h-11 items-center">
              <WhatsAppIcon className="absolute left-4 size-4 text-brand" />
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
              The number you launched from, with the country code
            </span>
          </label>

          {error && <p className="text-xs text-error">{error}</p>}

          <button
            type="submit"
            disabled={!phoneReady || busy}
            className="flex h-11 w-fit items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "One moment" : "Continue"}
          </button>
        </form>
      )}

      {stage === "send" && started && (
        <div className="animate-fade-slide-up motion-reduce:animate-none flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold tracking-wider text-secondary">
              SEND THIS FROM {phone.trim()}
            </span>
            <span className="tnum w-fit rounded-xl border border-primary/[0.06] bg-field px-5 py-3 font-mono text-2xl tracking-[0.3em] text-primary">
              {started.code}
            </span>
          </div>

          <a
            href={started.link}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-fit items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
          >
            <WhatsAppIcon className="size-4" />
            Open WhatsApp and send
          </a>

          <p className="flex items-center gap-2 text-xs text-secondary">
            <span className="size-2 animate-pulse rounded-full bg-brand motion-reduce:animate-none" />
            Waiting for your message. This page moves on by itself
          </p>

          {started.stub && (
            <p className="rounded-lg border border-queued/25 bg-queued/[0.07] px-3 py-2 text-xs text-queued">
              No WhatsApp line connected, so this local build signs you in
              without the message
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setStage("phone");
              setStarted(null);
              setError("");
            }}
            className={cn("w-fit text-sm text-secondary transition-colors hover:text-primary")}
          >
            Change number
          </button>
        </div>
      )}

      {stage === "wallet" && (
        <WalletLinker
          current={wallet}
          onLinked={(address) => {
            setWallet(address);
            setStage("done");
            router.refresh();
          }}
        />
      )}
    </Card>
  );
}
