import type { Metadata } from "next";
import { PageHero, StaleNotice } from "@/components/shell/page-hero";
import { AnalyticsBoard } from "@/components/analytics/analytics-board";
import { getStats } from "@/lib/data";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <>
      <PageHero
        eyebrow="Protocol"
        title="Analytics"
        description="How many tokens launched, how much they earned in creator fees and how much of that reached a phone"
      />
      <StaleNotice>
        Showing the last confirmed figures while the numbers recalculate
      </StaleNotice>

      <section className="mx-auto w-full px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
        <AnalyticsBoard stats={getStats()} />
      </section>
    </>
  );
}
