"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, XIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export const X_URL = "https://x.com/UseFornum";

/**
 * The bar above every page: the Fornum token's contract address, which can be
 * selected like any text or copied with the button, and the X account. The
 * address is set from /admin and shows here on the next request, no deploy
 */
export function TopBar({ ca }: { ca: string | null }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!ca) return;
    try {
      await navigator.clipboard.writeText(ca);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked, the address can still be selected */
    }
  }

  return (
    <div className="relative z-40 flex h-12 w-full shrink-0 items-center gap-3 px-4 nav:sticky nav:top-0 nav:h-14 lg:px-6">
      <div className="bar-solid pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
      </div>

      <div
        className={cn(
          "flex h-9 min-w-0 items-center gap-2 rounded-full border border-primary/[0.08] bg-card pl-3.5",
          ca ? "pr-1.5" : "pr-3.5",
        )}
      >
        <span className="shrink-0 text-[11px] font-bold tracking-[0.12em] text-brand select-none">CA:</span>
        {ca ? (
          <span className="min-w-0 cursor-text truncate font-mono text-xs text-primary select-all" title={ca}>
            {ca}
          </span>
        ) : (
          <span className="text-xs text-secondary">coming soon</span>
        )}
        {ca && (
          <button
            type="button"
            onClick={copy}
            aria-label="Copy the contract address"
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold transition-colors",
              copied ? "bg-brand/15 text-brand" : "bg-primary/[0.06] text-secondary hover:text-primary",
            )}
          >
            {copied ? <CheckIcon className="size-3" /> : <CopyIcon className="size-3" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
          </button>
        )}
      </div>

      <a
        href={X_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Fornum on X"
        className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/[0.08] bg-card text-primary transition-colors hover:border-primary/20 hover:bg-primary/[0.06]"
      >
        <XIcon className="size-4" />
      </a>
    </div>
  );
}
