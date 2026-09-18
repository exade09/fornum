"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { WALLETS } from "@/components/icons/wallets";
import { cn } from "@/lib/cn";

export function ConnectWallet({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "h-10 items-center rounded-full border px-5 text-sm font-bold whitespace-nowrap text-primary transition-colors hover:bg-card",
          className,
        )}
      >
        Connect wallet
      </button>

      {open && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Connect a wallet"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="animate-scale-in motion-reduce:animate-none relative w-full max-w-[380px] rounded-2xl border border-primary/[0.06] bg-card p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-primary">
                Connect wallet
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full text-secondary transition-colors hover:bg-background/70 hover:text-primary"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-1.5">
              {WALLETS.map((w, i) => {
                const Mark = w.Mark;
                return (
                  <button
                    key={w.id}
                    type="button"
                    className="animate-card-in motion-reduce:animate-none flex items-center gap-3 rounded-xl border border-primary/[0.06] bg-background/70 px-3 py-3 text-left transition-colors hover:border-primary/20"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <Mark className="size-8 shrink-0 rounded-lg" />
                    <span className="text-sm font-bold text-primary">
                      {w.name}
                    </span>
                    <span className="ml-auto text-xs text-secondary">
                      Detected
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-secondary">
              Signing turns on with the program, right now the interface runs on
              demo data
            </p>
          </div>
        </div>
      )}
    </>
  );
}
