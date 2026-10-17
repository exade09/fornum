import type { Metadata } from "next";
import { PageHero } from "@/components/shell/page-hero";
import { Card } from "@/components/ui/primitives";
import { LinkSignIn } from "@/components/auth/link-sign-in";
import { peekLink } from "@/lib/auth/sign-in-links";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/**
 * Where a sign in link from the chat lands
 *
 * Opening it changes nothing. WhatsApp fetches every link to draw a preview,
 * and that fetch must not use the link up, so the visitor presses a button
 */
export default async function SignInLinkPage({ params }: PageProps<"/s/[token]">) {
  const { token } = await params;
  const link = await peekLink(token);

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Your number is your account"
        description="This link came from the Fornum chat and signs you in with the number it was sent to"
      />

      <section className="mx-auto w-full px-4 pt-6 pb-10 lg:px-6 xl:max-w-xl">
        {link ? (
          <LinkSignIn token={token} masked={link.masked} />
        ) : (
          <Card sheen className="animate-section-in flex flex-col gap-3 p-6">
            <span className="text-lg font-bold text-primary">
              This link no longer works
            </span>
            <p className="text-sm text-secondary">
              Links work once and for a week. Write to the Fornum number for a
              new one, or sign in with your number on the site
            </p>
            <a
              href="/signin"
              className="mt-2 flex h-11 w-fit items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
            >
              Sign in with your number
            </a>
          </Card>
        )}
      </section>
    </>
  );
}
