import { cn } from "@/lib/cn";

/**
 * Число с «прокруткой» разрядов: каждая цифра — лента 0…9,
 * которая уезжает на нужную позицию. Чистый CSS, без счётчиков в JS.
 */
export function RollingNumber({
  value,
  size = 34,
  className,
  prefix,
}: {
  /** уже отформатированная строка, например "321,000.00" */
  value: string;
  /** высота строки разряда в px — она же шаг прокрутки */
  size?: number;
  className?: string;
  prefix?: string;
}) {
  const chars = value.split("");
  let digitIndex = 0;

  return (
    <span
      className={cn("tnum inline-flex items-end font-bold", className)}
      style={{ lineHeight: `${size}px` }}
      aria-label={prefix ? `${prefix}${value}` : value}
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
            {/* невидимая цифра задаёт ширину разряда по реальной метрике шрифта */}
            <span className="invisible" style={{ lineHeight: `${size}px` }}>
              {ch}
            </span>
            <span
              className="animate-digit-roll motion-reduce:animate-none absolute inset-x-0 top-0 flex flex-col items-center"
              /* transform задан и в inline-стиле: если анимация отключена
                 (prefers-reduced-motion), лента всё равно стоит на нужной
                 цифре, а не показывает ноль */
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
    </span>
  );
}
