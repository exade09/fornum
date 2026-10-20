import type { Metadata } from "next";
import { PageHero } from "@/components/shell/page-hero";
import { StatsControls } from "@/components/admin/stats-controls";
import { LaunchRecorder } from "@/components/admin/launch-recorder";
import { FeesRecorder } from "@/components/admin/fees-recorder";
import { TokenRemover } from "@/components/admin/token-remover";
import { SignInDesk } from "@/components/admin/sign-in-desk";
import { TokenImages } from "@/components/admin/token-images";
import { BuybackDesk } from "@/components/admin/buyback-desk";
import { FeeSplitDesk } from "@/components/admin/fee-split-desk";
import { CaEditor } from "@/components/admin/ca-editor";
import { contractAddress, getSetting } from "@/lib/settings";
import { launchTableAddress } from "@/lib/pump/policies";
import { verifiedLaunchTable } from "@/lib/pump/shares";
import { connect } from "@/lib/solana/read";
import { PublicKey } from "@solana/web3.js";
import { buybackConfig } from "@/lib/buyback/config";
import { ledgerSummary } from "@/lib/buyback/ledger";
import { AdminLogin, AdminLogout } from "@/components/admin/admin-login";
import { adminSetupProblem, isAdmin } from "@/lib/auth/admin";
import { ipfsProblem } from "@/lib/pump/ipfs";
import { launchFleet } from "@/lib/launch-fleet";
import { Card } from "@/components/ui/primitives";
import { siteConfig } from "@/lib/config";
import { hasDatabase } from "@/lib/db/client";
import { dbError } from "@/lib/db/store";
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

  const buyback = buybackConfig();
  const tableAddress = await launchTableAddress().catch(() => null);
  let tableProblem: string | null = null;
  if (tableAddress && buyback.settings.treasuryWallet) {
    try {
      await verifiedLaunchTable(connect(), tableAddress, new PublicKey(buyback.settings.treasuryWallet));
    } catch (err) {
      tableProblem = err instanceof Error ? err.message : String(err);
    }
  }
  const ledger = await ledgerSummary().catch((err) => {
    buyback.problems.push(`ledger: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  });

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

        <CaEditor current={await contractAddress()} />

        <SignInDesk />

        <FeeSplitDesk
          treasury={buyback.settings.treasuryWallet}
          treasuryProblem={
            buyback.problems.find((p) => p.startsWith("TREASURY")) ??
            (process.env.TREASURY_WALLET === undefined ? "TREASURY_WALLET is not set on this deployment, add it for Production and redeploy" : null)
          }
          table={tableAddress}
          tableProblem={tableProblem}
          pending={tokens.filter((t) => t.feeSharing === "pending").map((t) => t.id)}
        />

        <LaunchRecorder wallets={wallets} />

        <TokenImages tokens={tokens} />

        <BuybackDesk
          enabled={buyback.settings.enabled}
          treasury={buyback.settings.treasuryWallet}
          mint={buyback.settings.mainMint}
          problems={buyback.problems}
          lastPass={await getSetting("buyback_last_pass")}
          available={sol(ledger?.availableLamports ?? 0)}
          reserved={sol(ledger?.reservedLamports ?? 0)}
          pending={ledger?.pendingCredits ?? 0}
          manual={ledger?.manualCredits ?? 0}
          spent={sol(ledger?.spentLamports ?? 0)}
          network={exactSol(ledger?.networkLamports ?? 0)}
          burned={tokenAmount(ledger?.burned ?? "0", ledger?.decimals ?? 6)}
          jobs={(ledger?.jobs ?? []).map((j) => ({
            id: j.id,
            state: j.state,
            market: j.market,
            signature: j.signature,
            reserved: exactSol(j.reservedLamports),
            maxQuote: j.maxQuoteLamports === null ? null : exactSol(j.maxQuoteLamports),
            spent: j.actualMarketLamports === null ? null : exactSol(j.actualMarketLamports),
            network: j.actualNetworkLamports === null ? null : exactSol(j.actualNetworkLamports),
            burned: j.burnedAmount === null ? null : tokenAmount(j.burnedAmount, j.decimals ?? 6),
            error: j.error,
            createdAt: j.createdAt,
          }))}
        />

        <FeesRecorder tokens={sharedWalletTokens} />

        <StatsControls current={stats} overrides={siteConfig.overrides} />

        <TokenRemover tokens={tokens} />
      </section>
    </>
  );
}

/** Lamports as SOL with every digit that matters, for small fees */
function exactSol(lamports: number) {
  return `${(lamports / 1e9).toFixed(9).replace(/0+$/, "").replace(/\.$/, "")} SOL`;
}

/** A raw token amount in whole tokens */
function tokenAmount(raw: string, decimals: number) {
  const n = BigInt(raw || "0");
  return (n / BigInt(10) ** BigInt(decimals)).toLocaleString("en-US");
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
