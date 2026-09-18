import type { Metadata } from "next";
import { PageHero } from "@/components/shell/page-hero";
import { ConsentForm } from "@/components/consent/consent-form";

export const metadata: Metadata = { title: "Consent" };

export default function OptOutPage() {
  return (
    <>
      <PageHero
        title="Calls to your number"
        description="A number is only dialed while consent is active. Turn it off here and every pending call to it is dropped"
      />
      <section className="mx-auto w-full px-4 pt-6 pb-10 lg:px-6 xl:max-w-3xl">
        <ConsentForm />
      </section>
    </>
  );
}
