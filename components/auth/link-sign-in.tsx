"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/primitives";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { WalletLinker } from "@/components/wallet/wallet-linker";

type Stage = "confirm" | "wallet" | "done";

/** One press to use the link, then the same wallet step as the sign in form */
export function LinkSignIn({ token, masked }: { token: string; masked: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("confirm");
  const [wallet, setWallet] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not sign in with this link");
      return;
    }

    const body = (await res.json()) as { wallet: string | null };
    setWallet(body.wallet);
    setStage(body.wallet ? "done" : "wallet");
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
        <span className="text-lg font-bold text-primary">You are signed in</span>
        <p className="tnum max-w-[44ch] text-sm text-secondary">
          {masked} is confirmed and its fees go to the linked wallet
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
          {stage === "wallet" ? "Link your wallet" : "Continue with your number"}
        </h2>
        <p className="text-sm text-secondary">
          {stage === "wallet"
            ? `${masked} is confirmed. Pick the wallet the fees should go to, you can change it later`
            : "The link works once. After this you stay signed in on this device for thirty days"}
        </p>
      </div>

      {stage === "confirm" ? (
        <>
          <span className="flex w-fit items-center gap-2 rounded-xl border border-primary/[0.06] bg-field px-4 py-3">
            <WhatsAppIcon className="size-4 text-brand" />
            <span className="tnum text-base font-bold text-primary">{masked}</span>
          </span>

          {error && <p className="text-xs text-error">{error}</p>}

          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="flex h-11 w-fit items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Signing in" : "Sign in"}
          </button>
        </>
      ) : (
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
