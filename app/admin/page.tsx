import type { Metadata } from "next";
import { PageHero } from "@/components/shell/page-hero";
import { StatsControls } from "@/components/admin/stats-controls";
import { LaunchRecorder } from "@/components/admin/launch-recorder";
import { FeesRecorder } from "@/components/admin/fees-recorder";
import { TokenRemover } from "@/components/admin/token-remover";
import { SignInDesk } from "@/components/admin/sign-in-desk";
import { TokenImages } from "@/components/admin/token-images";
import { BuybackDesk } from "@/components/admin/buyback-desk";
import { fornumTokenMint } from "@/lib/pump/buyback";
import { AdminLogin, AdminLogout } from "@/components/admin/admin-login";
import { adminSetupProblem, isAdmin } from "@/lib/auth/admin";
import { ipfsProblem } from "@/lib/pump/ipfs";
import { launchFleet } from "@/lib/launch-fleet";
import { Card } from "@/components/ui/primitives";
import { siteConfig } from "@/lib/config";
import { hasDatabase } from "@/lib/db/client";
import { buybackTotals, dbError } from "@/lib/db/store";
import { liveTokens } from "@/lib/tokens";
import { getStats, sol } from "@/lib/data";
import { balanceOf, launchWalletAddress } from "@/lib/solana/wallet";

export const metadata: Metadata = {
  title: "Controls",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // nothing below is shown, or even read, until the password is in
  if (!(await isAdmin())) {
    return (
      <>
        <PageHero eyebrow="Internal" title="Site controls" description="Operators only" />
        <AdminLogin problem={adminSetupProblem()} />
      </>
    );
  }

  const stats = await getStats();
  const dbFault = dbError();
  const tokens = await liveTokens();
  const sharedWalletTokens = tokens.filter(
    (t) => t.walletIndex === null || t.walletIndex === undefined,
  );
  const pinning = ipfsProblem();
  const wallet = launchWalletAddress();

  // state of every launch wallet: derived, balances read in one call, each one
  // matched against what has actually been launched
  const wallets = await launchFleet();
  const buybacks = await buybackTotals();
  const buybackWaiting = tokens.reduce((a, t) => a + (t.buybackPendingLamports ?? 0), 0);

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
              value={
                !hasDatabase
                  ? "in memory, not persisted"
                  : dbFault
                    ? dbFault
                    : "connected"
              }
              ok={hasDatabase && !dbFault}
            />
            <Row
              label="Demo rows"
              value={siteConfig.demoData ? "on" : "off"}
              ok={!siteConfig.demoData}
            />
            <Row
              label="Funding wallet"
              value={wallet ?? "LAUNCH_WALLET_SECRET is not set"}
              ok={Boolean(wallet)}
              mono
            />
            <Row
              label="Funding wallet balance"
              value={balance === null ? "unknown" : sol(balance)}
              ok={balance !== null && balance > 0}
            />
            <Row
              label="Pictures"
              value={pinning ?? "IPFS through Pinata"}
              ok={!pinning}
            />
            <Row
              label="Launch wallets"
              value={
                wallets === null
                  ? "LAUNCH_WALLETS_MNEMONIC is not set"
                  : `${wallets.filter((w) => w.state === "ready").length} ready of ${wallets.length}`
              }
              ok={Boolean(wallets?.some((w) => w.state === "ready"))}
            />
          </div>
          <AdminLogout />
        </Card>

        <SignInDesk />

        <LaunchRecorder wallets={wallets} />

        <TokenImages tokens={tokens} />

        <BuybackDesk
          mint={fornumTokenMint()}
          waiting={sol(buybackWaiting)}
          spent={sol(buybacks.spentLamports)}
          burned={tokenAmount(buybacks.burned, buybacks.decimals)}
          count={buybacks.count}
        />

        <FeesRecorder tokens={sharedWalletTokens} />

        <StatsControls current={stats} overrides={siteConfig.overrides} />

        <TokenRemover tokens={tokens} />
      </section>
    </>
  );
}

/** A raw token amount in whole tokens, with thousands separators */
function tokenAmount(raw: string, decimals: number) {
  const n = BigInt(raw || "0");
  const unit = BigInt(10) ** BigInt(decimals);
  return (n / unit).toLocaleString("en-US");
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
