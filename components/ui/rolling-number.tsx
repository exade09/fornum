import { cn } from "@/lib/cn";

/**
 * A number whose digits roll into place. Each digit is a 0 to 9 strip that
 * slides to its position, pure CSS with no counters in JS
 */
export function RollingNumber({
  value,
  size = 34,
  className,
  prefix,
  suffix,
}: {
  /** already formatted, for example "321,000.00" */
  value: string;
  /** height of one digit in px, which is also the roll step */
  size?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const chars = value.split("");
  let digitIndex = 0;

  return (
    <span
      className={cn("tnum inline-flex items-end font-bold", className)}
      style={{ lineHeight: `${size}px` }}
      aria-label={`${prefix ?? ""}${value}${suffix ?? ""}`}
    >
      {prefix && <span aria-hidden="true">{prefix}</span>}

      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) {
          return (
            <span key={i} aria-hidden="true">
              {ch}
            </span>
          );
        }
        const delay = digitIndex++ * 70;
        return (
          <span
            key={i}
            aria-hidden="true"
            className="relative inline-block overflow-hidden align-bottom"
            style={{ height: size }}
          >
            {/* an invisible digit sets the column width from the real font metrics */}
            <span className="invisible" style={{ lineHeight: `${size}px` }}>
              {ch}
            </span>
            <span
              className="animate-digit-roll motion-reduce:animate-none absolute inset-x-0 top-0 flex flex-col items-center"
              /* the end transform is also inline, so with animation off
                 (prefers-reduced-motion) the strip still rests on the right
                 digit instead of showing a zero */
              style={
                {
                  "--roll": `${-Number(ch) * size}px`,
                  transform: `translateY(${-Number(ch) * size}px)`,
                  animationDelay: `${delay}ms`,
                } as React.CSSProperties
              }
            >
              {Array.from({ length: 10 }, (_, d) => (
                <span key={d} style={{ height: size, lineHeight: `${size}px` }}>
                  {d}
                </span>
              ))}
            </span>
          </span>
        );
      })}

      {suffix && <span aria-hidden="true">{suffix}</span>}
    </span>
  );
}
