import { cn } from "@/lib/cn";

/**
 * Голосовая волна. Высоты детерминированы (псевдослучайны по индексу),
 * поэтому SSR и клиент рисуют одно и то же — гидратация не ругается.
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
              /* высота задана всегда: при отключённой анимации полосы
                 остаются на месте, а не схлопываются в ноль */
              height: `${22 + ((i * 37) % 78)}%`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
