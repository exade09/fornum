import { CheckIcon, PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { TokenMark } from "@/components/ui/token-mark";
import { Waveform } from "@/components/ui/waveform";
import { cn } from "@/lib/cn";

/**
 * The product, shown as the thing it actually is: one WhatsApp thread
 *
 * Messages land in order with a stagger, so the page reads like a conversation
 * playing rather than a static screenshot
 */

type Msg =
  | { from: "them" | "you"; text: string; time: string }
  | { from: "card"; time: string };

const THREAD: Msg[] = [
  { from: "you", text: "LAUNCH", time: "14:02" },
  {
    from: "them",
    text: "Send a name and a ticker, and an image if you have one",
    time: "14:02",
  },
  { from: "you", text: "Ledger Cat, LCAT", time: "14:03" },
  { from: "card", time: "14:03" },
  {
    from: "them",
    text: "Live. Creator fees now point at this number. I call you when the first ones land",
    time: "14:04",
  },
];

export function PhoneThread({ number }: { number: string }) {
  return (
    <div className="animate-scale-in motion-reduce:animate-none relative mx-auto w-full max-w-[330px]">
      {/* device */}
      <div className="relative overflow-hidden rounded-[38px] border border-primary/10 bg-[#0b141a] p-2 shadow-2xl ring-1 ring-primary/[0.06]">
        <div className="relative overflow-hidden rounded-[30px]">
          {/* thread header, the number everything goes through */}
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
            <PhoneIcon className="ml-auto size-4 shrink-0 text-white/50" />
          </div>

          {/* messages */}
          <div className="flex flex-col gap-2 bg-[#0b141a] px-3 py-4">
            {THREAD.map((m, i) => (
              <Bubble key={i} msg={m} delay={300 + i * 420} />
            ))}

            {/* the call that follows the thread */}
            <div
              className="animate-card-in motion-reduce:animate-none mt-1 flex flex-col gap-2 rounded-xl bg-[#202c33] p-3"
              style={{ animationDelay: `${300 + THREAD.length * 420}ms` }}
            >
              <div className="flex items-center gap-2">
                <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/20">
                  <span className="animate-ring-pulse motion-reduce:animate-none absolute size-7 rounded-full bg-brand/40" />
                  <PhoneIcon className="size-3.5 text-brand" />
                </span>
                <span className="text-[11px] text-white/80">
                  Fornum calling about your fees
                </span>
              </div>
              <Waveform className="h-5" bars={24} />
            </div>
          </div>
        </div>
      </div>

      {/* glow under the device */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -bottom-10 -z-10 h-32 rounded-full bg-brand/20 blur-3xl"
      />
    </div>
  );
}

function Bubble({ msg, delay }: { msg: Msg; delay: number }) {
  if (msg.from === "card") {
    return (
      <div
        className="animate-card-in motion-reduce:animate-none max-w-[85%] self-start rounded-xl rounded-tl-sm bg-[#202c33] p-2.5"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex items-center gap-2">
          <TokenMark symbol="LCAT" size="md" className="size-9" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[12px] font-bold text-white">
              LCAT
            </span>
            <span className="truncate font-mono text-[9px] text-white/50">
              7GkQ…q5Yn
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1 text-[10px] text-brand">
          <CheckIcon className="size-3" />
          Fees routed to this number
        </div>
        <span className="mt-1 block text-right text-[9px] text-white/40">
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
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-[12px] leading-snug text-white/90">{msg.text}</span>
      <span className="mt-0.5 block text-right text-[9px] text-white/40">
        {msg.time}
      </span>
    </div>
  );
}
