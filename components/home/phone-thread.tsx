import { WhatsAppIcon } from "@/components/icons";
import { TokenMark } from "@/components/ui/token-mark";
import { cn } from "@/lib/cn";

/**
 * The product, shown as the thing it actually is: one WhatsApp thread that
 * ends in a mint address
 *
 * Messages land in order with a stagger, so the page reads like a conversation
 * playing rather than a static screenshot
 */

type Msg =
  | { from: "them" | "you"; text: string; time: string }
  | { from: "image"; time: string }
  | { from: "launched"; time: string };

const THREAD: Msg[] = [
  { from: "you", text: "LAUNCH", time: "14:02" },
  {
    from: "them",
    text: "Send a name, a ticker and a picture",
    time: "14:02",
  },
  { from: "image", time: "14:03" },
  { from: "launched", time: "14:04" },
];

export function PhoneThread({ number }: { number: string }) {
  return (
    <div className="animate-scale-in motion-reduce:animate-none relative mx-auto w-full max-w-[330px]">
      <div className="relative overflow-hidden rounded-[38px] border border-primary/10 bg-[#0b141a] p-2 shadow-2xl ring-1 ring-primary/[0.06]">
        <div className="relative overflow-hidden rounded-[30px]">
          <div className="flex items-center gap-2.5 bg-[#202c33] px-3 py-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/20">
              <WhatsAppIcon className="size-4 text-brand" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-bold text-white">
                Fornum
              </span>
              <span className="tnum truncate text-[10px] text-white/50">
                {number}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-[#0b141a] px-3 py-4">
            {THREAD.map((m, i) => (
              <Bubble key={i} msg={m} delay={300 + i * 520} />
            ))}
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

  /* what the launcher sends: a picture with the name and ticker under it */
  if (msg.from === "image") {
    return (
      <div
        className="animate-card-in motion-reduce:animate-none max-w-[80%] self-end overflow-hidden rounded-xl rounded-tr-sm bg-[#005c4b] p-1"
        style={style}
      >
        <TokenMark symbol="LCAT" size="xl" className="h-32 w-full rounded-lg" />
        <div className="px-2 pt-1.5 pb-1">
          <span className="block text-[12px] leading-snug text-white/90">
            NAME: Ledger Cat
          </span>
          <span className="block text-[12px] leading-snug text-white/90">
            TICKER: LCAT
          </span>
          <span className="mt-0.5 block text-right text-[9px] text-white/40">
            {msg.time}
          </span>
        </div>
      </div>
    );
  }

  /* the reply that ends the thread: the mint is live */
  if (msg.from === "launched") {
    return (
      <div
        className="animate-card-in motion-reduce:animate-none max-w-[85%] self-start rounded-xl rounded-tl-sm bg-[#202c33] px-3 py-2"
        style={style}
      >
        <span className="text-[12px] leading-snug text-white/90">Launched</span>
        <span className="mt-1 block font-mono text-[10px] leading-snug break-all text-brand">
          pump.fun/7GkQmARuK3xy9pLd2V8sNfTcH1bZoW4eXjMv6RsUq5Yn
        </span>
        <span className="mt-1 block text-[10px] text-white/60">
          Fees are yours, claim them on the site
        </span>
        <span className="mt-0.5 block text-right text-[9px] text-white/40">
          {msg.time}
        </span>
      </div>
    );
  }

  const mine = msg.from === "you";

  return (
    <div
      className={cn(
        "animate-card-in motion-reduce:animate-none max-w-[85%] rounded-xl px-3 py-2",
        mine
          ? "self-end rounded-tr-sm bg-[#005c4b]"
          : "self-start rounded-tl-sm bg-[#202c33]",
      )}
      style={style}
    >
      <span className="text-[12px] leading-snug text-white/90">{msg.text}</span>
      <span className="mt-0.5 block text-right text-[9px] text-white/40">
        {msg.time}
      </span>
    </div>
  );
}
