import type { Metadata } from "next";
import { PageHero } from "@/components/shell/page-hero";
import { StatsControls } from "@/components/admin/stats-controls";
import { siteConfig } from "@/lib/config";
import { getStats } from "@/lib/data";

export const metadata: Metadata = {
  title: "Controls",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <PageHero
        title="Site controls"
        description="Every counter on the site is computed from real activity. Pin one here when you want to show a specific number instead"
      />
      <section className="mx-auto w-full px-4 pt-6 pb-10 lg:px-6 xl:max-w-4xl">
        <StatsControls current={getStats()} overrides={siteConfig.overrides} />
      </section>
    </>
  );
}
