"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives";
import { TokenMark } from "@/components/ui/token-mark";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { WalletPicker } from "@/components/admin/wallet-picker";
import { ReplyBox } from "@/components/admin/sign-in-desk";
import type { LaunchWallet } from "@/lib/launch-fleet";

/**
 * Launch a coin on pump.fun from here
 *
 * The operator types what the person sent in the chat: name, ticker, picture
 * and their number. The site pins the picture, deploys the coin from a funded,
 * unused launch wallet, records the mint and writes the reply for the chat.
 * There is no mint to copy and no fee figure to type, ever
 */
export function LaunchRecorder({ wallets }: { wallets: LaunchWallet[] | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const [feesTo, setFeesTo] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [showLinks, setShowLinks] = useState(false);
  const [walletIndex, setWalletIndex] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: string; mint: string; signature: string; split?: string } | null>(null);
  const [reply, setReply] = useState("");

  const preview = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  // the first funded, unused wallet unless the operator picks another
  const firstReady = wallets?.find((w) => w.state === "ready")?.index;
  const chosen = walletIndex !== "" ? walletIndex : firstReady !== undefined ? String(firstReady) : "";
  const readyCount = wallets?.filter((w) => w.state === "ready").length ?? 0;

  const ready =
    name.trim().length > 0 &&
    symbol.trim().length > 0 &&
    image !== null &&
    phone.replace(/\D/g, "").length >= 8 &&
    chosen !== "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy || !image) return;

    setBusy(true);
    setError("");
    setReply("");
    setDone(null);

    const form = new FormData();
    form.append("name", name.trim());
    form.append("symbol", symbol.trim());
    form.append("description", description.trim());
    form.append("image", image);
    form.append("phone", phone);
    if (feesTo.trim()) form.append("feesTo", feesTo.trim());
    if (twitter.trim()) form.append("twitter", twitter.trim());
    if (telegram.trim()) form.append("telegram", telegram.trim());
    if (website.trim()) form.append("website", website.trim());
    form.append("walletIndex", chosen);

    const res = await fetch("/api/admin/launch", { method: "POST", body: form }).catch(() => null);
    setBusy(false);

    if (!res?.ok) {
      const body = await res?.json().catch(() => ({}));
      setError(body?.error ?? "The launch failed");
      return;
    }

    const body = (await res.json()) as { id: string; mint: string; signature: string; reply: string; split?: string };
    setDone({ id: body.id, mint: body.mint, signature: body.signature, split: body.split });
    setReply(body.reply);
    setName("");
    setSymbol("");
    setDescription("");
    setImage(null);
    setPhone("");
    setFeesTo("");
    setTwitter("");
    setTelegram("");
    setWebsite("");
    setWalletIndex("");
    router.refresh();
  }

  return (
    <Card sheen className="animate-section-in flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-normal text-primary">Launch a token</h2>
        <p className="text-sm text-secondary">
          Put in what the person sent in the chat. The coin is deployed on pump.fun from
          a funded launch wallet, the mint is recorded by itself and you get the reply
          for the chat. Fees are read off the chain from then on
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          <label className="group relative shrink-0 cursor-pointer" title="Pick the picture">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="size-20 rounded-xl object-cover" />
            ) : (
              <TokenMark symbol={symbol.trim() || "NEW"} size="xl" className="size-20" />
            )}
            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/55 text-[10px] font-bold tracking-wider text-white uppercase opacity-0 transition-opacity group-hover:opacity-100">
              {preview ? "Change" : "Picture"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <Text label="Name" value={name} onChange={(v) => setName(v.slice(0, 32))} placeholder="Ledger Cat" />
            <Text
              label="Ticker"
              value={symbol}
              onChange={(v) => setSymbol(v.toUpperCase().replace(/\s/g, "").slice(0, 10))}
              placeholder="LCAT"
            />
          </div>
        </div>
        {!image && (
          <p className="-mt-2 text-xs text-secondary">
            Click the square to add the picture they sent. It becomes the coin's image on
            pump.fun and here
          </p>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
            Description, optional
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            rows={2}
            className="w-full resize-none rounded-lg border border-primary/[0.06] bg-field px-3 py-2 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          />
        </label>

        <button
          type="button"
          onClick={() => setShowLinks((v) => !v)}
          className="w-fit text-xs text-secondary underline-offset-4 hover:text-primary hover:underline"
        >
          {showLinks ? "Hide links" : "Add X, Telegram or a website"}
        </button>
        {showLinks && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Text label="X" value={twitter} onChange={setTwitter} placeholder="https://x.com/..." />
            <Text label="Telegram" value={telegram} onChange={setTelegram} placeholder="https://t.me/..." />
            <Text label="Website" value={website} onChange={setWebsite} placeholder="https://..." />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Phone label="Launched by" value={phone} onChange={setPhone} placeholder="+1 415 555 01 42" />
          <Phone label="Fees to, if different" value={feesTo} onChange={setFeesTo} placeholder="optional" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
            Launch from{wallets ? ` · ${readyCount} ready` : ""}
          </span>
          <WalletPicker wallets={wallets} selected={chosen} onSelect={(i) => setWalletIndex(String(i))} />
          {wallets && readyCount === 0 && (
            <p className="text-xs text-warning">
              No funded, unused wallet left. Run the funding script before the next launch
            </p>
          )}
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!ready || busy}
            className={cn(
              "flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {busy ? "Launching, up to a minute" : "Launch on pump.fun"}
          </button>

          {done && (
            <span className="animate-fade-slide-up motion-reduce:animate-none flex flex-wrap items-center gap-1.5 text-xs text-brand">
              <CheckIcon className="size-3.5" />
              live as {done.id}
              <a
                href={`https://pump.fun/coin/${done.mint}`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                pump.fun
              </a>
              <a
                href={`https://solscan.io/tx/${done.signature}`}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                transaction
              </a>
              {done.split && <span className="basis-full text-secondary">{done.split}</span>}
            </span>
          )}
        </div>

        {reply && <ReplyBox text={reply} />}
      </form>
    </Card>
  );
}

function Text({
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
      <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
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
      <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">{label}</span>
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
