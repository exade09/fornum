import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Token icon. If the launch carried an image we render it, otherwise we draw a
 * mark from the symbol so a slot is never empty while art is missing
 *
 * The hue, the angle and the pattern all come from the symbol, so the same
 * token always looks the same on every screen and across reloads
 */

function hash(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function seedHue(seed: string) {
  return hash(seed) % 360;
}

const SIZE_TEXT: Record<string, string> = {
  sm: "text-[9px]",
  md: "text-[11px]",
  lg: "text-[15px]",
  xl: "text-[22px]",
};

export function TokenMark({
  symbol,
  image,
  className,
  size = "md",
  rounded = "xl",
}: {
  symbol: string;
  image?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  rounded?: "full" | "xl";
}) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-xl";

  if (image) {
    return (
      <span
        className={cn(
          "relative block shrink-0 overflow-hidden",
          radius,
          className,
        )}
      >
        <Image
          src={image}
          alt={symbol}
          fill
          sizes="96px"
          className="object-cover"
        />
      </span>
    );
  }

  const h = hash(symbol);
  const hue = h % 360;
  const hue2 = (hue + 42 + (h % 30)) % 360;
  const angle = 110 + (h % 120);
  const letters = symbol
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();
  // three variants keep a wall of marks from looking like one repeated tile
  const variant = h % 3;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden",
        radius,
        className,
      )}
      style={{
        background: `linear-gradient(${angle}deg, hsl(${hue} 72% 56%), hsl(${hue2} 62% 32%))`,
      }}
      aria-hidden="true"
    >
      {variant === 0 && (
        <span
          className="absolute -top-1/3 -left-1/4 size-[120%] opacity-45"
          style={{
            background: `radial-gradient(circle at 30% 25%, hsl(${hue} 90% 76% / 0.85), transparent 58%)`,
          }}
        />
      )}
      {variant === 1 && (
        <span
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `repeating-linear-gradient(${angle}deg, hsl(0 0% 100% / 0.45) 0 2px, transparent 2px 9px)`,
          }}
        />
      )}
      {variant === 2 && (
        <span
          className="absolute -right-1/4 -bottom-1/3 size-[110%] rounded-full opacity-35"
          style={{ background: `hsl(${hue2} 85% 70% / 0.7)` }}
        />
      )}

      <span
        className={cn(
          "relative font-bold tracking-tight text-white/95",
          SIZE_TEXT[size],
        )}
        style={{ textShadow: "0 1px 2px hsl(0 0% 0% / 0.35)" }}
      >
        {letters}
      </span>
    </span>
  );
}

/** Round mark for a wallet address, same idea as the token one */
export function WalletMark({
  address,
  className,
}: {
  address: string;
  className?: string;
}) {
  const h = hash(address);
  const hue = h % 360;
  const cells = Array.from({ length: 9 }, (_, i) => (h >> i) & 1);

  return (
    <span
      className={cn(
        "grid shrink-0 grid-cols-3 gap-px overflow-hidden rounded-full p-1.5",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 60% 22%), hsl(${
          (hue + 50) % 360
        } 55% 12%))`,
      }}
      aria-hidden="true"
    >
      {cells.map((on, i) => (
        <span
          key={i}
          className="rounded-[1px]"
          style={{
            background: on
              ? `hsl(${(hue + i * 12) % 360} 85% 68%)`
              : "transparent",
          }}
        />
      ))}
    </span>
  );
}
