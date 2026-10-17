import Image from "next/image";
import logo from "@/public/logo.png";
import { cn } from "@/lib/cn";

/**
 * The product, shown as the thing it actually is: one WhatsApp thread that
 * ends in a mint address
 *
 * Laid out like WhatsApp's own chat screen: the contact header, a date chip,
 * the encryption notice, bubbles with tails and their times inside, and the
 * input row. Accents use the Fornum green. Messages land in order with a
 * stagger, so the page reads like a conversation playing rather than a static
 * screenshot
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
const OUT = "#1d5a3c";
const IN = "#262628";
const ACCENT = "#3ec46d";

/** The doodles WhatsApp draws behind every chat, kept faint */
const WALLPAPER = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' fill='none' stroke='#ffffff' stroke-opacity='0.045' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'>
    <circle cx='16' cy='18' r='7'/><path d='M13 17h.01M19 17h.01M13 21c1.5 1.5 4.5 1.5 6 0'/>
    <path d='M48 10l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L39 17l6-1z'/>
    <rect x='82' y='8' width='18' height='13' rx='3'/><path d='M86 21v5l5-5'/>
    <path d='M20 52c-4-4-10 0-6 5l6 6 6-6c4-5-2-9-6-5z'/>
    <path d='M50 46h16v12a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4zM66 50h3a3 3 0 0 1 0 6h-3'/>
    <circle cx='96' cy='54' r='9'/><path d='M96 48v6l4 2'/>
    <path d='M10 92l8-10 6 7 4-4 8 9z'/><circle cx='30' cy='84' r='2'/>
    <path d='M54 84a8 8 0 1 1 16 0c0 6-8 12-8 12s-8-6-8-12z'/><circle cx='62' cy='84' r='2.5'/>
    <path d='M88 86l12-6-4 14-3-5z'/>
    <path d='M104 108l4-4M100 112l2-2'/><path d='M40 110h10M45 105v10'/>
  </svg>`,
)}")`;

export function PhoneThread({ number }: { number: string }) {
  return (
    <div className="animate-scale-in motion-reduce:animate-none relative mx-auto w-full max-w-[330px]">
      <div className="relative overflow-hidden rounded-[38px] border border-primary/10 bg-[#0b0b0b] p-2 shadow-2xl ring-1 ring-primary/[0.06]">
        <div className="relative overflow-hidden rounded-[30px] bg-[#0b0b0b]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#161618] px-2.5 py-2">
            <Chevron />
            <Image
              src={logo}
              alt=""
              width={34}
              height={34}
              className="size-[34px] shrink-0 rounded-full"
            />
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="truncate text-[14px] font-semibold text-white">
                Fornum
              </span>
              <span className="tnum truncate text-[11px] text-white/45">
                {number}
              </span>
            </div>
            <VideoIcon />
            <PhoneIcon />
          </div>

          <div
            className="flex flex-col gap-1 px-2.5 pt-2 pb-3"
            style={{ backgroundImage: WALLPAPER, backgroundSize: "120px 120px" }}
          >
            <span className="self-center rounded-md bg-[#1d1d1f] px-2.5 py-0.5 text-[10px] font-medium text-white/55">
              Today
            </span>
            <span className="mx-3 mb-1 flex items-start justify-center gap-1 rounded-md bg-[#201e17] px-2.5 py-1.5 text-center text-[9.5px] leading-snug text-[#e9c46a]">
              <Lock />
              Messages and calls are end-to-end encrypted. Only people in this
              chat can read, listen to, or share them. Learn more
            </span>
            {THREAD.map((m, i) => (
              <Bubble key={i} msg={m} delay={300 + i * STEP} />
            ))}
          </div>

          <div className="flex items-center gap-2.5 border-t border-white/[0.06] bg-[#161618] px-3 py-2">
            <Plus />
            <span className="flex h-7 flex-1 items-center justify-end rounded-full border border-white/[0.06] bg-[#232325] px-2">
              <Sticker />
            </span>
            <Camera />
            <Mic />
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

/** A bubble with WhatsApp's little tail on the sender's side */
function Shell({
  mine,
  delay,
  className,
  children,
}: {
  mine: boolean;
  delay: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "animate-card-in motion-reduce:animate-none relative rounded-xl",
        mine ? "self-end rounded-br-[4px]" : "self-start rounded-bl-[4px]",
        className,
      )}
      style={{ animationDelay: `${delay}ms`, backgroundColor: mine ? OUT : IN }}
    >
      {children}
      <svg
        viewBox="0 0 8 10"
        aria-hidden="true"
        className={cn("absolute bottom-0 h-2.5 w-2", mine ? "-right-[5px]" : "-left-[5px] -scale-x-100")}
      >
        <path d="M0 0v10h8C4 9 1 6 0 0Z" fill={mine ? OUT : IN} />
      </svg>
    </div>
  );
}

function Bubble({ msg, delay }: { msg: Msg; delay: number }) {
  /* Fornum is typing, shown for one step and then gone */
  if (msg.kind === "typing") {
    return (
      <div
        className="animate-typing-window motion-reduce:hidden self-start overflow-hidden"
        style={{ animationDelay: `${delay}ms`, animationDuration: `${STEP}ms` }}
      >
        <span className="flex h-7 items-center gap-1 rounded-xl px-3" style={{ backgroundColor: IN }}>
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
      <Shell mine delay={delay} className="w-[54%] p-[3px]">
        <Image
          src={logo}
          alt=""
          width={220}
          height={220}
          className="aspect-square w-full rounded-[9px]"
        />
        <div className="flex items-end justify-between gap-1 px-1.5 pt-1 pb-0.5">
          <span className="text-[12px] leading-snug whitespace-nowrap text-white">
            NAME: Fornum
            <br />
            TICKER: FORNUM
          </span>
          <Meta mine />
        </div>
      </Shell>
    );
  }

  /* the reply that ends the launch: the mint is live */
  if (msg.kind === "launched") {
    return (
      <Shell mine={false} delay={delay} className="flex max-w-[96%] items-end gap-2 px-2.5 py-1.5">
        <span className="text-[12.5px] leading-snug whitespace-nowrap text-white">
          Launched pump.fun/xxxxxxxxxxxx
        </span>
        <Meta />
      </Shell>
    );
  }

  /* and where the fees collect, to be claimed on the site */
  if (msg.kind === "fees") {
    return (
      <Shell mine={false} delay={delay} className="max-w-[92%] px-2.5 py-1.5">
        <span className="block text-[12.5px] leading-snug text-white">
          Your launch wallet:
          <br />
          [xxxxxxxxx]
          <br />
          Fees are yours, claim them on the site
        </span>
        <div className="flex justify-end">
          <Meta />
        </div>
      </Shell>
    );
  }

  const mine = msg.kind === "you";
  return (
    <Shell mine={mine} delay={delay} className="flex max-w-[92%] items-end gap-2 px-2.5 py-1.5">
      <span className="text-[12.5px] leading-snug whitespace-nowrap text-white">{msg.text}</span>
      <Meta mine={mine} />
    </Shell>
  );
}

/** Time inside the bubble, and the blue read ticks on what the launcher sent */
function Meta({ mine = false }: { mine?: boolean }) {
  return (
    <span className="flex shrink-0 translate-y-0.5 items-center gap-0.5 text-[9.5px] leading-none text-white/50">
      17:22
      {mine && (
        <svg viewBox="0 0 16 10" className="h-2.5 w-4" aria-hidden="true">
          <path d="M1 5.5 3.6 8 8.6 2M6.4 7.2 7.2 8l5-6" fill="none" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

const icon = { fill: "none", stroke: ACCENT, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Chevron() {
  return (
    <svg viewBox="0 0 10 18" className="h-[18px] w-2.5 shrink-0" aria-hidden="true">
      <path d="M8.5 1.5 1.5 9l7 7.5" {...icon} strokeWidth={2.2} />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 16" className="h-4 w-6 shrink-0" aria-hidden="true">
      <rect x="1" y="1.5" width="14.5" height="13" rx="3" {...icon} />
      <path d="m16.5 6.2 5.5-3.2v10l-5.5-3.2" {...icon} />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" className="ml-1 size-[18px] shrink-0" aria-hidden="true">
      <path d="M5.2 2.5h2.6l1.4 3.8-2 1.4a10 10 0 0 0 5.1 5.1l1.4-2 3.8 1.4v2.6a1.7 1.7 0 0 1-1.9 1.7C9.1 16 4 10.9 3.5 4.4a1.7 1.7 0 0 1 1.7-1.9Z" {...icon} />
    </svg>
  );
}

function Lock() {
  return (
    <svg viewBox="0 0 10 12" className="mt-[1px] h-2.5 w-2 shrink-0" aria-hidden="true">
      <rect x="1" y="5" width="8" height="6" rx="1.2" fill="#e9c46a" />
      <path d="M3 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke="#e9c46a" strokeWidth="1.3" />
    </svg>
  );
}

function Plus() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden="true">
      <path d="M8 1.5v13M1.5 8h13" {...icon} strokeWidth={2} />
    </svg>
  );
}

function Sticker() {
  return (
    <svg viewBox="0 0 16 16" className="size-[15px]" aria-hidden="true">
      <path d="M14.5 8.5V4a2.5 2.5 0 0 0-2.5-2.5H4A2.5 2.5 0 0 0 1.5 4v8A2.5 2.5 0 0 0 4 14.5h4.5l6-6Zm0 0h-3.5a2.5 2.5 0 0 0-2.5 2.5v3.5" {...icon} strokeWidth={1.5} />
    </svg>
  );
}

function Camera() {
  return (
    <svg viewBox="0 0 20 16" className="h-4 w-5 shrink-0" aria-hidden="true">
      <path d="M2 4.5h3l1.5-2.5h7L15 4.5h3v9.5H2z" {...icon} />
      <circle cx="10" cy="9" r="3" {...icon} />
    </svg>
  );
}

function Mic() {
  return (
    <svg viewBox="0 0 12 18" className="h-[17px] w-3 shrink-0" aria-hidden="true">
      <rect x="3" y="1" width="6" height="10" rx="3" {...icon} />
      <path d="M1 8.5a5 5 0 0 0 10 0M6 13.5V17" {...icon} />
    </svg>
  );
}
