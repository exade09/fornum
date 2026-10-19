"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/primitives";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

const POLL_MS = 10_000;

type Pending = { code: string; masked: string; createdAt: string };

/**
 * Where the operator lets people in
 *
 * A visitor on /signin gets a code and sends it to the number. It shows up
 * here and in the WhatsApp Business app at the same time. Type the number the
 * message came from next to its code and confirm: the site checks it matches
 * the number the visitor typed, and their page moves on by itself.
 *
 * For somebody who just writes asking to sign in, make a link instead and
 * paste the reply into their thread
 */
export function SignInDesk() {
  const [pending, setPending] = useState<Pending[] | null>(null);
  const [listError, setListError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/sign-ins").catch(() => null);
    if (!res?.ok) {
      setListError(res?.status === 401 ? "Signed out, reload the page" : "Could not load the queue");
      setPending(null);
      return;
    }
    setListError("");
    setPending(((await res.json()) as { pending: Pending[] }).pending);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <Card sheen className="animate-section-in flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-normal text-primary">
          Sign ins
        </h2>
        <p className="text-sm text-secondary">
          Codes people were given on the site. When one arrives in the chat,
          type the number it came from next to it and confirm
        </p>
      </div>


      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
          Waiting{pending ? ` · ${pending.length}` : ""}
        </span>
        {listError && <p className="text-xs text-error">{listError}</p>}
        {pending?.length === 0 && (
          <p className="text-xs text-secondary">Nobody is waiting right now</p>
        )}
        {pending?.map((p) => (
          <PendingRow key={p.code} item={p} onDone={load} />
        ))}
      </div>

      <LinkMaker />
    </Card>
  );
}

function PendingRow({ item, onDone }: { item: Pending; onDone: () => void }) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function approve(e: React.FormEvent) {
    e.preventDefault();
    if (busy || phone.replace(/\D/g, "").length < 8) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/sign-ins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: item.code, phone }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not confirm it");
      return;
    }
    setDone(true);
    setTimeout(onDone, 1500);
  }

  return (
    <form
      onSubmit={approve}
      className="flex flex-col gap-3 rounded-xl border border-primary/[0.06] bg-background/70 p-3 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-[170px] flex-col">
        <span className="font-mono text-lg tracking-[0.2em] text-primary">{item.code}</span>
        <span className="tnum text-xs text-secondary">
          {item.masked} · {ago(item.createdAt)}
        </span>
      </div>

      {done ? (
        <span className="flex items-center gap-1.5 text-sm text-brand">
          <CheckIcon className="size-4" /> Signed in
        </span>
      ) : (
        <>
          <span className="relative flex h-10 flex-1 items-center">
            <WhatsAppIcon className="absolute left-3 size-4 text-brand" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="Number the code came from"
              className="tnum h-10 w-full rounded-lg border border-primary/[0.06] bg-field pr-3 pl-9 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
          </span>
          <button
            type="submit"
            disabled={busy || phone.replace(/\D/g, "").length < 8}
            className={cn(
              "flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {busy ? "Checking" : "Confirm"}
          </button>
        </>
      )}
      {error && <p className="text-xs text-error sm:basis-full">{error}</p>}
    </form>
  );
}

function LinkMaker() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");

  async function make(e: React.FormEvent) {
    e.preventDefault();
    if (busy || phone.replace(/\D/g, "").length < 8) return;
    setBusy(true);
    setError("");
    setReply("");
    const res = await fetch("/api/admin/sign-in-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not make a link");
      return;
    }
    setReply(((await res.json()) as { reply: string }).reply);
  }

  return (
    <form onSubmit={make} className="flex flex-col gap-3 border-t border-primary/[0.06] pt-5">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold text-primary">Send a sign in link</span>
        <span className="text-xs text-secondary">
          For somebody who wrote asking to sign in. Paste the reply only into
          the thread of this number: whoever opens the link is signed in as it
        </span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <span className="relative flex h-10 flex-1 items-center">
          <WhatsAppIcon className="absolute left-3 size-4 text-brand" />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="Their number, as WhatsApp shows it"
            className="tnum h-10 w-full rounded-lg border border-primary/[0.06] bg-field pr-3 pl-9 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          />
        </span>
        <button
          type="submit"
          disabled={busy || phone.replace(/\D/g, "").length < 8}
          className={cn(
            "flex h-10 items-center justify-center rounded-full border px-5 text-sm font-bold text-primary transition-colors hover:bg-background/70",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {busy ? "Making" : "Make link"}
        </button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      {reply && <ReplyBox text={reply} />}
    </form>
  );
}

/** A reply ready to paste into WhatsApp, with one button to copy it */
export function ReplyBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* select it by hand */
    }
  }

  return (
    <div className="animate-fade-slide-up motion-reduce:animate-none flex flex-col gap-2">
      <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
        Reply for the chat
      </span>
      <textarea
        readOnly
        value={text}
        rows={text.split("\n").length + 1}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full resize-none rounded-lg border border-primary/[0.06] bg-field px-3 py-2 font-mono text-xs leading-relaxed text-primary"
      />
      <button
        type="button"
        onClick={copy}
        className="flex h-9 w-fit items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-background transition-colors hover:bg-primary-hover"
      >
        {copied ? <CheckIcon className="size-3.5" /> : <WhatsAppIcon className="size-3.5" />}
        {copied ? "Copied" : "Copy reply"}
      </button>
    </div>
  );
}

function ago(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} h ago`;
}
