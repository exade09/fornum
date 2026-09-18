import type { Metadata } from "next";
import { PageHero } from "@/components/shell/page-hero";
import { ConsentForm } from "@/components/consent/consent-form";

export const metadata: Metadata = { title: "Согласие и отписка" };

export default function OptOutPage() {
  return (
    <>
      <PageHero
        title="Согласие на звонки"
        description="Номер участвует в обзвоне, только пока согласие активно. Отозвать его можно в любой момент — заявки, адресованные этому номеру, вернут средства создателям."
      />
      <section className="mx-auto w-full px-4 pt-6 pb-10 lg:px-6 xl:max-w-3xl">
        <ConsentForm />
      </section>
    </>
  );
}
