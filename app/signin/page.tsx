import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/shell/page-hero";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Card } from "@/components/ui/primitives";
import { AccountWallet } from "@/components/wallet/account-wallet";
import { readSession } from "@/lib/auth/session";
import { getWallet } from "@/lib/db/store";
import { chatLink, peekChallenge } from "@/lib/auth/verify";
import { CHALLENGE_COOKIE } from "@/lib/auth/challenge-cookie";
import { cookies } from "next/headers";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  const session = await readSession();
  const wallet = session ? await getWallet(session.sub) : null;

  // a code this browser asked for and is still waiting on
  const [id, secret] = ((await cookies()).get(CHALLENGE_COOKIE)?.value ?? "").split(".");
  const waiting = !session && id && secret ? await peekChallenge(id, secret) : null;
  const resume = waiting
    ? { code: waiting.code, link: chatLink(waiting.code), masked: waiting.masked }
    : null;

  return (
    <>
      <PageHero
        eyebrow="Account"
        title="Your number is your account"
        description="Sign in with the phone you launched from: send one message from its WhatsApp, link a wallet, and claim what your tokens earned"
      />

      <section className="mx-auto grid w-full gap-3 px-4 pt-6 pb-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-6 xl:max-w-4xl">
        {session ? (
          <Card sheen className="animate-section-in flex flex-col gap-3 p-6">
            <span className="text-sm text-secondary">Signed in as</span>
            <span className="tnum text-xl font-bold text-primary">
              {session.masked}
            </span>
            <p className="max-w-[52ch] text-sm text-secondary">
              {wallet
                ? "Fees from tokens on this number are claimed to the wallet below"
                : "Link the wallet your fees should go to"}
            </p>
            <div className="mt-2">
              <AccountWallet initial={wallet} />
            </div>
            <Link
              href="/tokens"
              className="mt-2 flex h-11 w-fit items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
            >
              Find your token
            </Link>
          </Card>
        ) : (
          <SignInForm resume={resume} />
        )}

        <Card className="animate-section-in flex h-fit flex-col gap-2 p-5 text-xs text-secondary">
          <span className="text-sm font-bold text-primary">What we keep</span>
          <p>
            The session holds a salted hash of the number and a masked copy for
            display. The number itself is not stored in the cookie
          </p>
          <p>
            Signing in is how a number proves it is yours: we confirm the code
            only when it arrives from the number you typed, so only the number
            a token was launched from can claim what it earned
          </p>
        </Card>
      </section>
    </>
  );
}
