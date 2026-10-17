import Image from "next/image";
import logo from "@/public/logo.png";
import { cn } from "@/lib/cn";

/**
 * The product, shown as the thing it actually is: one WhatsApp thread that
 * ends in a mint address
 *
 * Drawn as a phone with the WhatsApp dark theme, the same thread the promo
 * videos play: LAUNCH, the prompt, the picture with its name and ticker, then
 * the mint and the launch wallet, with the addresses left as placeholders. Messages land in order with a stagger, so
 * the page reads like a conversation playing rather than a static screenshot
 */

type Msg =
  | { kind: "you"; text: string }
  | { kind: "them"; text: string }
  | { kind: "picture" }
  | { kind: "typing" }
  | { kind: "launched" }
  | { kind: "fees" };

const THREAD: Msg[] = [
  { kind: "you", text: "LAUNCH" },
  { kind: "them", text: "Send a name, a ticker and a picture" },
  { kind: "picture" },
  { kind: "typing" },
  { kind: "launched" },
  { kind: "fees" },
];

const STEP = 560;

export function PhoneThread({ number }: { number: string }) {
  return (
    <div className="animate-scale-in motion-reduce:animate-none relative mx-auto w-full max-w-[312px]">
      <div className="relative rounded-[54px] bg-gradient-to-b from-[#3a3a3e] to-[#1c1c1e] p-[2px] shadow-2xl">
        <div className="rounded-[52px] bg-black p-[9px]">
          <div className="relative overflow-hidden rounded-[44px] bg-[#0e0e0e]">
            <StatusBar />

            <div className="flex items-center gap-2.5 border-b border-white/[0.06] bg-[#141414] px-3 pt-1 pb-2.5">
              <Chevron />
              <Image
                src={logo}
                alt=""
                width={36}
                height={36}
                className="size-9 shrink-0 rounded-full"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] font-semibold text-white">
                  Fornum
                </span>
                <span className="tnum truncate text-[11px] text-white/50">
                  {number}
                </span>
              </div>
              <VideoIcon />
            </div>

            <div
              className="flex min-h-[392px] flex-col gap-1.5 px-2.5 py-3"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.025) 0 2px, transparent 3px), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.02) 0 3px, transparent 4px)",
                backgroundSize: "46px 46px, 62px 62px",
              }}
            >
              <span className="mb-1 self-center rounded-full bg-[#1e1e1e] px-3 py-0.5 text-[11px] font-semibold text-white/50">
                Today
              </span>
              {THREAD.map((m, i) => (
                <Bubble key={i} msg={m} delay={300 + i * STEP} />
              ))}
            </div>

            <div className="flex items-center gap-2 bg-[#101010] px-3 pt-2.5 pb-7">
              <span className="text-[22px] leading-none font-light text-white">+</span>
              <span className="h-8 flex-1 rounded-full bg-[#222]" />
              <span className="flex size-8 items-center justify-center rounded-full bg-[#2ccb5a]">
                <Mic />
              </span>
            </div>
            <span className="absolute bottom-2 left-1/2 h-[4px] w-28 -translate-x-1/2 rounded-full bg-white/80" />
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -bottom-10 -z-10 h-32 rounded-full bg-brand/20 blur-3xl"
      />
    </div>
  );
}

function Bubble({ msg, delay }: { msg: Msg; delay: number }) {
  const style = { animationDelay: `${delay}ms` };
  const card = "animate-card-in motion-reduce:animate-none";

  /* Fornum is typing, shown for one step and then gone */
  if (msg.kind === "typing") {
    return (
      <div
        className="animate-typing-window motion-reduce:hidden self-start overflow-hidden"
        style={{ animationDelay: `${delay}ms`, animationDuration: `${STEP}ms` }}
      >
        <span className="flex h-8 items-center gap-1 rounded-2xl bg-[#242626] px-3.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-pulse rounded-full bg-white/60"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </span>
      </div>
    );
  }

  /* what the launcher sends: a picture with the name and ticker under it */
  if (msg.kind === "picture") {
    return (
      <div className={cn(card, "w-[56%] self-end rounded-2xl bg-[#16482e] p-1")} style={style}>
        <Image
          src={logo}
          alt=""
          width={220}
          height={220}
          className="aspect-square w-full rounded-xl"
        />
        <div className="px-2 pt-1.5 pb-1">
          <span className="block text-[13px] leading-snug text-white">NAME: Fornum</span>
          <span className="block text-[13px] leading-snug text-white">TICKER: FORNUM</span>
          <Meta mine />
        </div>
      </div>
    );
  }

  /* the reply that ends the launch: the mint is live */
  if (msg.kind === "launched") {
    return (
      <div className={cn(card, "max-w-[94%] self-start rounded-2xl bg-[#242626] px-3 py-2")} style={style}>
        <span className="block text-[13px] leading-snug whitespace-nowrap text-white">
          Launched pump.fun/xxxxxxxxxxxx
        </span>
        <Meta />
      </div>
    );
  }

  /* and where the fees collect, to be claimed on the site */
  if (msg.kind === "fees") {
    return (
      <div className={cn(card, "max-w-[86%] self-start rounded-2xl bg-[#242626] px-3 py-2")} style={style}>
        <span className="block text-[13px] leading-snug text-white">Your launch wallet:</span>
        <span className="block text-[13px] leading-snug text-white">[xxxxxxxxx]</span>
        <span className="block text-[13px] leading-snug text-white">
          Fees are yours, claim them on the site
        </span>
        <Meta />
      </div>
    );
  }

  const mine = msg.kind === "you";
  return (
    <div
      className={cn(
        card,
        "max-w-[78%] rounded-2xl px-3 py-1.5",
        mine ? "self-end bg-[#16482e]" : "self-start bg-[#242626]",
      )}
      style={style}
    >
      <span className="text-[13px] leading-snug text-white">{msg.text}</span>
      <Meta mine={mine} />
    </div>
  );
}

/** Time, and the blue read ticks on what the launcher sent */
function Meta({ mine = false }: { mine?: boolean }) {
  return (
    <span className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-white/45">
      17:22
      {mine && (
        <svg viewBox="0 0 16 10" className="h-2.5 w-4" aria-hidden="true">
          <path d="M1 5.5 3.6 8 8.6 2M6.4 7.2 7.2 8l5-6" fill="none" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function StatusBar() {
  return (
    <div className="relative flex h-11 items-center justify-between px-7 text-white">
      <span className="tnum text-[14px] font-semibold">17:22</span>
      <span className="absolute top-2.5 left-1/2 h-[26px] w-[90px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <svg viewBox="0 0 18 12" className="h-2.5 w-4" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.6} y={9 - i * 2.6} width="3" height={3 + i * 2.6} rx="0.8" fill="currentColor" />
          ))}
        </svg>
        <svg viewBox="0 0 26 12" className="h-2.5 w-6" aria-hidden="true">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="currentColor" opacity="0.5" />
          <rect x="2" y="2" width="17" height="8" rx="1.8" fill="currentColor" />
          <rect x="23.5" y="4" width="1.8" height="4" rx="0.9" fill="currentColor" opacity="0.5" />
        </svg>
      </span>
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 10 18" className="h-4 w-2.5 shrink-0 text-white" aria-hidden="true">
      <path d="M8.5 1.5 1.5 9l7 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 16" className="h-4 w-6 shrink-0 text-white" aria-hidden="true">
      <rect x="1" y="1.5" width="15" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m17.5 6 5-3v10l-5-3Z" fill="currentColor" />
    </svg>
  );
}

function Mic() {
  return (
    <svg viewBox="0 0 12 18" className="h-4 w-3 text-white" aria-hidden="true">
      <rect x="3" y="1" width="6" height="10" rx="3" fill="currentColor" />
      <path d="M1 8.5a5 5 0 0 0 10 0M6 13.5V17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
