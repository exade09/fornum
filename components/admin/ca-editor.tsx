"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives";
import { CheckIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * The contract address in the site header. Saved here, it shows on every page
 * right away, no deploy. Empty shows "coming soon"
 */
export function CaEditor({ current }: { current: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/admin/ca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ca: value.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(body.error ?? "Could not save it");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-normal text-primary">Contract address</h2>
        <p className="text-sm text-secondary">
          Shown as CA in the header of every page and copied with one click. It changes right after
          saving. Leave it empty to show &quot;coming soon&quot;
        </p>
      </div>
      <form onSubmit={save} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          placeholder="Token mint address"
          spellCheck={false}
          className="h-10 w-full min-w-0 flex-1 rounded-lg border border-primary/[0.06] bg-field px-3 font-mono text-xs text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
        />
        <button
          type="submit"
          disabled={busy || value.trim() === (current ?? "")}
          className={cn(
            "flex h-10 shrink-0 items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover",
            "disabled:cursor-not-allowed disabled:opacity-40",
          )}
        >
          {busy ? "Saving" : "Save"}
        </button>
      </form>
      {error && <p className="text-xs text-error">{error}</p>}
      {saved && (
        <span className="flex items-center gap-1.5 text-xs text-brand">
          <CheckIcon className="size-3.5" />
          Saved, the header shows it now
        </span>
      )}
    </Card>
  );
}
