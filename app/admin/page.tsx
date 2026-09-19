import type { Metadata } from "next";
import { PageHero } from "@/components/shell/page-hero";
import { StatsControls } from "@/components/admin/stats-controls";
import { LaunchRecorder } from "@/components/admin/launch-recorder";
import { Card } from "@/components/ui/primitives";
import { siteConfig } from "@/lib/config";
import { hasDatabase } from "@/lib/db/client";
import { getStats, sol } from "@/lib/data";
import { balanceOf, launchWalletAddress } from "@/lib/solana/wallet";

export const metadata: Metadata = {
  title: "Controls",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const stats = await getStats();
  const wallet = launchWalletAddress();

  let balance: number | null = null;
  if (wallet) {
    try {
      balance = await balanceOf(wallet);
    } catch {
      balance = null;
    }
  }

  return (
    <>
      <PageHero
        eyebrow="Internal"
        title="Site controls"
        description="Counters come from the database. Pin one here when you want to show a specific number instead"
      />

      <section className="mx-auto flex w-full flex-col gap-3 px-4 pt-6 pb-10 lg:px-6 xl:max-w-4xl">
        <Card sheen className="animate-section-in flex flex-col gap-4 p-6">
          <span className="text-sm font-bold text-primary">Wiring</span>
          <div className="grid gap-4 sm:grid-cols-2">
            <Row
              label="Database"
              value={hasDatabase ? "connected" : "in memory, not persisted"}
              ok={hasDatabase}
            />
            <Row
              label="Demo rows"
              value={siteConfig.demoData ? "on" : "off"}
              ok={!siteConfig.demoData}
            />
            <Row
              label="Launch wallet"
              value={wallet ?? "LAUNCH_WALLET_SECRET is not set"}
              ok={Boolean(wallet)}
              mono
            />
            <Row
              label="Wallet balance"
              value={balance === null ? "unknown" : sol(balance)}
              ok={balance !== null && balance > 0}
            />
          </div>
        </Card>

        <LaunchRecorder />

        <StatsControls current={stats} overrides={siteConfig.overrides} />
      </section>
    </>
  );
}

function Row({
  label,
  value,
  ok,
  mono = false,
}: {
  label: string;
  value: string;
  ok: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
        {label}
      </span>
      <span
        className={`truncate text-sm ${mono ? "font-mono text-xs" : ""} ${
          ok ? "text-brand" : "text-queued"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
