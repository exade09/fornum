import { LAMPORTS_PER_SOL } from "@/lib/types";

/**
 * Display helpers, safe on both sides of the wire
 *
 * Kept apart from lib/data.ts on purpose: that one reaches the database, and
 * anything a client component imports must not drag the driver into the bundle
 */

/** Lamports as SOL, trimmed so small amounts stay readable */
export function sol(lamports: number, digits = 3) {
  const value = lamports / LAMPORTS_PER_SOL;
  if (value === 0) return "0 SOL";
  if (value > 0 && value < 0.001) return "<0.001 SOL";
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  })} SOL`;
}

/** The dollar label next to an amount, or nothing when the price is unknown */
export function usdFrom(lamports: number, price: number | null) {
  if (price === null) return null;
  const value = (lamports / LAMPORTS_PER_SOL) * price;
  const fraction = value < 100 ? 2 : 0;
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  })}`;
}

export function usd(value: number, fraction = 2) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  })}`;
}

export function compactUsd(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function num(value: number) {
  return value.toLocaleString("en-US");
}

export function shortAddress(address: string, head = 4, tail = 4) {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}
