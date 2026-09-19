import type { Metadata } from "next";
import { PageHero } from "@/components/shell/page-hero";
import { LaunchForm } from "@/components/launch/launch-form";

export const metadata: Metadata = { title: "Launch" };

export default function LaunchPage() {
  return (
    <>
      <PageHero
        eyebrow="Start here"
        title="Launch a token"
        description="Fornum deploys the mint with our treasury as the creator fee recipient. Fees then go to the WhatsApp number you name here, and nowhere else"
      />
      <section className="mx-auto w-full px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
        <LaunchForm />
      </section>
    </>
  );
}
