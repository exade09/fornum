"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

/** The only thing /admin shows until the operator has signed in */
export function AdminLogin({ problem }: { problem: string | null }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(problem ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }).catch(() => null);
    setBusy(false);

    if (!res?.ok) {
      const body = await res?.json().catch(() => ({}));
      setError(body?.error ?? "Could not sign in");
      return;
    }
    setPassword("");
    router.refresh();
  }

  return (
    <section className="mx-auto flex w-full flex-col px-4 pt-6 pb-10 lg:px-6 xl:max-w-md">
      <Card sheen className="animate-section-in flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-xl font-normal text-primary">Admin sign in</h2>
          <p className="text-sm text-secondary">Enter the admin password to open the controls</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-lg border border-primary/[0.06] bg-field px-3 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
          </label>
          {error && <p className="text-xs text-error">{error}</p>}
          <button
            type="submit"
            disabled={!password || busy || Boolean(problem)}
            className={cn(
              "flex h-10 w-fit items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            {busy ? "Checking" : "Sign in"}
          </button>
        </form>
      </Card>
    </section>
  );
}

/** Ends the operator session */
export function AdminLogout() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/login", { method: "DELETE" }).catch(() => null);
        router.refresh();
      }}
      className="w-fit text-xs text-secondary underline-offset-4 transition-colors hover:text-primary hover:underline"
    >
      Sign out of the admin
    </button>
  );
}
