import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

/** Wallet marks drawn inline so nothing depends on a remote asset */

export function PhantomMark(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <rect width="32" height="32" rx="9" fill="#AB9FF2" />
      <path
        d="M25.2 16.1c0 4.9-4 8.9-8.9 8.9H8.9c-1 0-1.6-1.1-1-1.9 1-1.4 2.4-3.4 3-4.6.2-.4.7-.5 1-.2.6.5 1.6 1.1 2.6 1.1 1.9 0 3-1.3 3-3.3v-2c0-.4.3-.7.7-.7h1.5c.4 0 .7.3.7.7v2c0 .5.4.9.9.9s.9-.4.9-.9v-2c0-.4.3-.7.7-.7h1.5c.4 0 .7.3.7.7v2Z"
        fill="#fff"
      />
      <circle cx="12.6" cy="13.3" r="1.5" fill="#AB9FF2" />
      <circle cx="17.4" cy="13.3" r="1.5" fill="#AB9FF2" />
    </svg>
  );
}

export function SolflareMark(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <rect width="32" height="32" rx="9" fill="#101010" />
      <path
        d="M16 5.5c1.6 4.2 3.3 6.4 7 7.6-3.7 1.2-5.4 3.4-7 7.6-1.6-4.2-3.3-6.4-7-7.6 3.7-1.2 5.4-3.4 7-7.6Z"
        fill="#FFC10B"
      />
      <path
        d="M16 19.4c.9 2.4 1.9 3.6 4 4.3-2.1.7-3.1 1.9-4 4.3-.9-2.4-1.9-3.6-4-4.3 2.1-.7 3.1-1.9 4-4.3Z"
        fill="#FE8F13"
      />
    </svg>
  );
}

export function BackpackMark(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <rect width="32" height="32" rx="9" fill="#E33E3F" />
      <path
        d="M11.8 11.4V9.8a4.2 4.2 0 0 1 8.4 0v1.6h1.2c1.4 0 2.5 1.1 2.5 2.5v2.3H8.1v-2.3c0-1.4 1.1-2.5 2.5-2.5h1.2Zm2.1 0h4.2V9.8a2.1 2.1 0 1 0-4.2 0v1.6Z"
        fill="#fff"
      />
      <path
        d="M8.1 18.3h15.8v3.4c0 1.4-1.1 2.5-2.5 2.5H10.6a2.5 2.5 0 0 1-2.5-2.5v-3.4Z"
        fill="#fff"
        opacity=".85"
      />
    </svg>
  );
}

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
