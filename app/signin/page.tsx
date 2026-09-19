import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/shell/page-hero";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Card } from "@/components/ui/primitives";
import { isConfigured } from "@/lib/auth/verify";
import { readSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  const session = await readSession();

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Your number is your account"
        description="Sign in with the phone that should receive the fees. We send one code over WhatsApp, or over SMS if you prefer"
      />

      <section className="mx-auto grid w-full gap-3 px-4 pt-6 pb-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-6 xl:max-w-4xl">
        {session ? (
          <Card sheen className="animate-section-in flex flex-col gap-3 p-6">
            <span className="text-sm text-secondary">Signed in as</span>
            <span className="tnum text-xl font-bold text-primary">
              {session.masked}
            </span>
            <p className="max-w-[52ch] text-sm text-secondary">
              Tokens you launch can point their fees at this number without a
              second confirmation
            </p>
            <Link
              href="/launch"
              className="mt-2 flex h-11 w-fit items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
            >
              Launch a token
            </Link>
          </Card>
        ) : (
          <SignInForm configured={isConfigured()} />
        )}

        <Card className="animate-section-in flex h-fit flex-col gap-2 p-5 text-xs text-secondary">
          <span className="text-sm font-bold text-primary">
            What we keep
          </span>
          <p>
            The session holds a salted hash of the number and a masked copy for
            display. The number itself is not stored in the cookie
          </p>
          <p>
            Signing in is also how consent is recorded, so a number that never
            signed in is never called
          </p>
        </Card>
      </section>
    </>
  );
}
