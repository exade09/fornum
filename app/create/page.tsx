import type { Metadata } from "next";
import { PageHero } from "@/components/shell/page-hero";
import { RequestForm } from "@/components/create/request-form";

export const metadata: Metadata = { title: "Create" };

export default function CreatePage() {
  return (
    <>
      <PageHero
        title="Создать заявку"
        description="Две формы: обзвон подписчиков по токену и перевод комиссий получателю. Обе кладут заявку в очередь и держат сумму в эскроу до факта дозвона."
      />
      <section className="mx-auto w-full px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
        <RequestForm />
      </section>
    </>
  );
}
