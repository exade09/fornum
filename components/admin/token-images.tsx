"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives";
import { TokenMark } from "@/components/ui/token-mark";
import type { Token } from "@/lib/types";

/**
 * Pictures of the coins already launched
 *
 * New launches get theirs from the launch form. This is for changing one, or
 * for coins recorded before pictures were kept. It changes what the site
 * shows; pump.fun keeps the picture the coin was launched with
 */
export function TokenImages({ tokens }: { tokens: Token[] }) {
  if (tokens.length === 0) return null;

  return (
    <Card className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-normal text-primary">Token pictures</h2>
        <p className="text-sm text-secondary">
          Click a picture to replace it. The site shows the new one at once; the coin on
          pump.fun keeps the picture it was launched with
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {tokens.map((t) => (
          <Row key={t.id} token={t} />
        ))}
      </div>
    </Card>
  );
}

function Row({ token }: { token: Token }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    const form = new FormData();
    form.append("tokenId", token.id);
    form.append("image", file);
    const res = await fetch("/api/admin/token-image", { method: "POST", body: form }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const body = await res?.json().catch(() => ({}));
      setError(body?.error ?? "Upload failed");
      return;
    }
    router.refresh();
  }

  async function clear() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/token-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId: token.id }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      setError("Could not remove it");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/[0.06] bg-background/70 p-3">
      <label className={`group relative shrink-0 ${busy ? "cursor-wait opacity-60" : "cursor-pointer"}`}>
        <TokenMark symbol={token.symbol} image={token.imageUrl ?? undefined} size="lg" className="size-12" />
        <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/55 text-[9px] font-bold tracking-wider text-white uppercase opacity-0 transition-opacity group-hover:opacity-100">
          {busy ? "…" : "Change"}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
      </label>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-bold text-primary">
          {token.name} <span className="text-secondary">{token.symbol}</span>
        </span>
        {error ? (
          <span className="text-xs text-error">{error}</span>
        ) : token.imageUrl ? (
          <button
            type="button"
            onClick={clear}
            disabled={busy}
            className="w-fit text-xs text-secondary hover:text-primary"
          >
            Remove picture
          </button>
        ) : (
          <span className="text-xs text-secondary">No picture, a mark is drawn</span>
        )}
      </div>
    </div>
  );
}
