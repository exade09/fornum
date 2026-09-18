import type { Metadata } from "next";
import { PageHero, StaleNotice } from "@/components/shell/page-hero";
import { AnalyticsBoard } from "@/components/analytics/analytics-board";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <>
      <PageHero
        title="Аналитика"
        description="Сколько заявок прошло очередь, какая доля звонков дошла до подтверждённых номеров и какой объём ушёл получателям."
      />
      <StaleNotice>
        Показаны последние подтверждённые цифры, пока аналитика пересчитывается.
      </StaleNotice>

      <section className="mx-auto w-full px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
        <AnalyticsBoard />
      </section>
    </>
  );
}
