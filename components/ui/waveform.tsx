import { cn } from "@/lib/cn";

/**
 * Voice bars. Heights are derived from the index, so the server and the
 * client draw the same thing and hydration stays quiet
 */
export function Waveform({
  bars = 28,
  className,
  paused = false,
}: {
  bars?: number;
  className?: string;
  paused?: boolean;
}) {
  return (
    <div className={cn("flex items-end gap-0.5", className)} aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={cn(
            "flex-1 rounded-full bg-brand/60",
            !paused && "animate-waveform motion-reduce:animate-none",
          )}
          style={
            {
              "--bar-h": `${22 + ((i * 37) % 78)}%`,
              "--wave-dur": `${0.7 + (i % 5) * 0.12}s`,
              animationDelay: `${i * 45}ms`,
              /* height is always set, so with animation off the bars hold
                 their shape instead of collapsing */
              height: `${22 + ((i * 37) % 78)}%`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
