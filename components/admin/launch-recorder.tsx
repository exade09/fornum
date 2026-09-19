"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";
import { TokenMark } from "@/components/ui/token-mark";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

const KEY = "fornum:admin-token";

/**
 * What the operator fills in after deploying a mint by hand
 *
 * The admin secret is typed once and kept in this browser, never bundled and
 * never stored on the server, which is the right shape for a console one person
 * uses rather than an account system
 */
export function LaunchRecorder() {
  const [secret, setSecret] = useState("");
  const [mint, setMint] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [phone, setPhone] = useState("");
  const [feesTo, setFeesTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    try {
      setSecret(window.localStorage.getItem(KEY) ?? "");
    } catch {
      /* private mode, the field just starts empty */
    }
  }, []);

  const ready =
    secret.length > 0 &&
    mint.trim().length >= 32 &&
    name.trim().length > 1 &&
    symbol.trim().length > 0 &&
    phone.replace(/\D/g, "").length >= 8;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;

    setBusy(true);
    setError("");
    try {
      window.localStorage.setItem(KEY, secret);
    } catch {
      /* not important enough to fail on */
    }

    const res = await fetch("/api/admin/launch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        mint: mint.trim(),
        name: name.trim(),
        symbol: symbol.trim(),
        phone,
        feesTo: feesTo.trim() || undefined,
      }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not record it");
      return;
    }

    const body = (await res.json()) as { id: string };
    setSaved(body.id);
    setMint("");
    setName("");
    setSymbol("");
    setPhone("");
    setFeesTo("");
  }

  return (
    <Card sheen className="animate-section-in flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-normal text-primary">
          Record a launch
        </h2>
        <p className="text-sm text-secondary">
          Deploy the mint on pump.fun from the launch wallet, then put it here
          so the site can show it and the owner can claim
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <TokenMark
            symbol={symbol.trim() || "NEW"}
            size="xl"
            className="size-16"
          />
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <Text
              label="Name"
              value={name}
              onChange={setName}
              placeholder="Ledger Cat"
            />
            <Text
              label="Ticker"
              value={symbol}
              onChange={(v) => setSymbol(v.toUpperCase().slice(0, 10))}
              placeholder="LCAT"
            />
          </div>
        </div>

        <Text
          label="Mint address"
          value={mint}
          onChange={setMint}
          placeholder="7GkQmARuK3xy9pLd2V8sNfTcH1bZoW4eXjMv6RsUq5Yn"
          mono
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Phone
            label="Launched by"
            value={phone}
            onChange={setPhone}
            placeholder="+1 415 555 01 42"
          />
          <Phone
            label="Fees to, if different"
            value={feesTo}
            onChange={setFeesTo}
            placeholder="optional"
          />
        </div>

        <Text
          label="Admin token"
          value={secret}
          onChange={setSecret}
          placeholder="ADMIN_TOKEN"
          mono
        />

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!ready || busy}
            className={cn(
              "flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {busy ? "Saving" : "Record it"}
          </button>

          {saved && (
            <span className="animate-fade-slide-up motion-reduce:animate-none flex items-center gap-1.5 text-xs text-brand">
              <CheckIcon className="size-3.5" />
              saved as {saved}
            </span>
          )}
        </div>
      </form>
    </Card>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
          mono && "font-mono text-xs",
        )}
      />
    </label>
  );
}

function Phone({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
        {label}
      </span>
      <span className="relative flex h-10 items-center">
        <WhatsAppIcon className="absolute left-3 size-4 text-brand" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="tel"
          placeholder={placeholder}
          className="tnum h-10 w-full rounded-lg border border-primary/[0.06] bg-field pr-3 pl-9 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        />
      </span>
    </label>
  );
}
