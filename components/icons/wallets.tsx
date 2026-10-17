import Image, { type StaticImageData } from "next/image";
import type { SVGProps } from "react";
import phantom from "@/public/wallets/phantom.png";
import solflare from "@/public/wallets/solflare.jpg";
import backpack from "@/public/wallets/backpack.png";
import { cn } from "@/lib/cn";

type Props = SVGProps<SVGSVGElement>;

/**
 * Phantom, Solflare and Backpack use their own published marks, served from
 * public/wallets. Static imports, so Next knows the size and serves the right
 * resolution. The square artwork is rounded by whatever className the caller
 * passes, the same as the drawn marks below
 */
function WalletImage({
  src,
  className,
}: {
  src: StaticImageData;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt=""
      width={64}
      height={64}
      className={cn("object-cover", className)}
    />
  );
}

export function PhantomMark({ className }: Props) {
  return <WalletImage src={phantom} className={className} />;
}

export function SolflareMark({ className }: Props) {
  return <WalletImage src={solflare} className={className} />;
}

export function BackpackMark({ className }: Props) {
  return <WalletImage src={backpack} className={className} />;
}

/** Marks without an official file are drawn inline, so they need no remote asset */

export function LedgerMark(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <rect width="32" height="32" rx="9" fill="#141414" />
      <path
        d="M7.5 7.5h7v2.2H9.7v4.8H7.5V7.5Zm10 0h7v7h-2.2V9.7h-4.8V7.5ZM7.5 17.5h2.2v4.8h4.8v2.2h-7v-7Zm14.8 0h2.2v7h-7v-2.2h4.8v-4.8Z"
        fill="#fff"
      />
    </svg>
  );
}

export function SolanaMark(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="sol-g" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#0B0B0B" />
      <path
        d="M9.4 20.6c.2-.2.4-.3.7-.3h13c.4 0 .6.5.3.8l-2.8 2.8c-.2.2-.4.3-.7.3h-13c-.4 0-.6-.5-.3-.8l2.8-2.8Z"
        fill="url(#sol-g)"
      />
      <path
        d="M9.4 8.1c.2-.2.5-.3.7-.3h13c.4 0 .6.5.3.8l-2.8 2.8c-.2.2-.4.3-.7.3h-13c-.4 0-.6-.5-.3-.8l2.8-2.8Z"
        fill="url(#sol-g)"
      />
      <path
        d="M20.6 14.3c-.2-.2-.4-.3-.7-.3h-13c-.4 0-.6.5-.3.8l2.8 2.8c.2.2.4.3.7.3h13c.4 0 .6-.5.3-.8l-2.8-2.8Z"
        fill="url(#sol-g)"
      />
    </svg>
  );
}

export const WALLETS = [
  { id: "phantom", name: "Phantom", Mark: PhantomMark },
  { id: "solflare", name: "Solflare", Mark: SolflareMark },
  { id: "backpack", name: "Backpack", Mark: BackpackMark },
  { id: "ledger", name: "Ledger", Mark: LedgerMark },
];
