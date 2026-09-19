import Link from "next/link";
import { HeroStats } from "@/components/home/live-stats";
import { NumberPlate } from "@/components/home/number-plate";
import { PhoneThread } from "@/components/home/phone-thread";
import { ArrowRightIcon, WhatsAppIcon } from "@/components/icons";
import { siteConfig } from "@/lib/config";

const STEPS = [
  {
    n: "01",
    title: "Text LAUNCH",
    text: "One message to the number above, no app and no wallet needed",
  },
  {
    n: "02",
    title: "Send a name, a ticker and a picture",
    text: "We deploy it on pump.fun and send the mint address back in the thread",
  },
  {
    n: "03",
    title: "Claim the fees here",
    text: "Sign in with the same number, connect a wallet and take what the token earned",
  },
];

export default function HomePage() {
  const { display, e164 } = siteConfig.whatsapp;

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[620px] overflow-hidden">
        <div className="animate-orb-float motion-reduce:animate-none absolute -top-48 -left-32 size-[620px] rounded-full bg-brand/[0.07] blur-3xl" />
        <div
          className="animate-orb-float motion-reduce:animate-none absolute -top-24 right-0 size-[420px] rounded-full bg-dialing/[0.05] blur-3xl"
          style={{ animationDelay: "1.4s" }}
        />
      </div>

      <section className="mx-auto w-full px-4 pt-14 pb-16 lg:px-6 xl:max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="animate-section-in flex flex-col items-start gap-7">
            <h1 className="shimmer-text motion-reduce:animate-none max-w-[14ch] font-display text-4xl leading-[1.02] font-normal tracking-tight sm:text-5xl lg:text-[58px]">
              Launch a token with one message
            </h1>

            <p className="max-w-[48ch] text-base text-secondary sm:text-lg">
              Text Fornum on WhatsApp with a name, a ticker and a picture. The
              token goes live on pump.fun and its creator fees stay yours to
              claim
            </p>

            <NumberPlate display={display} e164={e164} />

            {/* the other way to use it: the fees never have to be yours */}
            <a
              href={`https://wa.me/${e164}?text=${encodeURIComponent("LAUNCH and send the fees to ")}`}
              target="_blank"
              rel="noreferrer"
              className="group -mt-2 flex items-center gap-2 rounded-full border border-primary/[0.08] bg-card px-4 py-2.5 text-sm text-secondary transition-colors hover:border-primary/20 hover:text-primary"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/15">
                <WhatsAppIcon className="size-3.5 text-brand" />
              </span>
              Or launch and route the fees to another number
              <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <PhoneThread number={display} />
        </div>
      </section>

      <section className="mx-auto w-full px-4 lg:px-6 xl:max-w-7xl">
        <HeroStats />
      </section>

      <section className="mx-auto w-full px-4 pt-16 pb-12 lg:px-6 xl:max-w-7xl">
        <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="animate-card-in motion-reduce:animate-none flex flex-col gap-2 border-t border-primary/[0.08] pt-5"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="tnum font-mono text-xs text-brand">{s.n}</span>
              <span className="text-base font-bold text-primary">
                {s.title}
              </span>
              <p className="max-w-[40ch] text-sm text-secondary">{s.text}</p>
            </li>
          ))}
        </ol>

        <Link
          href="/tokens"
          className="group mt-10 flex w-fit items-center gap-1.5 text-sm font-bold text-brand"
        >
          See what has been launched
          <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>
    </>
  );
}
