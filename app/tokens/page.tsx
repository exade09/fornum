import type { Metadata } from "next";
import { PageHero, StaleNotice } from "@/components/shell/page-hero";
import { TokensBrowser } from "@/components/tokens/tokens-browser";
import { TOKENS } from "@/lib/data";

export const metadata: Metadata = { title: "Tokens" };

export default function TokensPage() {
  return (
    <>
      <PageHero
        eyebrow="Directory"
        title="Tokens launched here"
        description="Every token on this page came out of a WhatsApp thread, which is why its creator fees are sitting here waiting to be claimed"
      />

      <StaleNotice>
        {TOKENS.length > 0
          ? "Showing the last confirmed state while the stream catches up with the chain"
          : "Nothing has launched yet. The first token through the thread shows up here"}
      </StaleNotice>

      <section className="mx-auto w-full px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
        <TokensBrowser />
      </section>
    </>
  );
}
