"use client";

import { useState } from "react";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * The number is the product, so it gets the largest interactive element on the
 * page: copy it, or open the thread straight away
 */
export function NumberPlate({
  display,
  e164,
}: {
  display: string;
  e164: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`+${e164}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked, the number is on screen anyway */
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <span className="text-[11px] font-bold tracking-[0.12em] text-secondary uppercase">
        Text this number
      </span>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${display}`}
          className="group card-sheen flex min-w-0 items-center gap-3 rounded-2xl border border-primary/[0.08] bg-card px-4 py-4 transition-colors hover:border-primary/20 sm:px-5"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/15">
            <WhatsAppIcon className="size-5 text-brand" />
          </span>
          <span className="tnum font-display text-xl font-normal tracking-tight whitespace-nowrap text-primary sm:text-2xl lg:text-3xl">
            {display}
          </span>
          <span
            className={cn(
              "ml-1 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold transition-colors",
              copied
                ? "bg-brand/15 text-brand"
                : "bg-primary/[0.06] text-secondary group-hover:text-primary",
            )}
          >
            {copied && <CheckIcon className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </span>
        </button>

        <a
          href={`https://wa.me/${e164}?text=LAUNCH`}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
        >
          <WhatsAppIcon className="size-4" />
          Open the chat
        </a>
      </div>

      <span className="text-xs text-secondary">
        Every launch, every confirmation and every payout call runs through this
        one thread
      </span>
    </div>
  );
}
