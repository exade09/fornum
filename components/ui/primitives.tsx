import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Карточка                                                            */
/* ------------------------------------------------------------------ */

export function Card({
  className,
  lift = false,
  sheen = false,
  ...props
}: React.ComponentProps<"div"> & { lift?: boolean; sheen?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/[0.06] bg-card",
        lift && "card-lift",
        sheen && "card-sheen",
        className,
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Статусы                                                             */
/* ------------------------------------------------------------------ */

export type Status = "queued" | "verifying" | "dialing" | "paid" | "refunded";

const STATUS_STYLE: Record<Status, { label: string; className: string }> = {
  queued: { label: "В очереди", className: "bg-queued/15 text-queued" },
  verifying: {
    label: "Ждёт подтверждения",
    className: "bg-warning/15 text-warning",
  },
  dialing: { label: "Дозвон", className: "bg-dialing/15 text-dialing" },
  paid: { label: "Выплачено", className: "bg-brand/15 text-brand" },
  refunded: { label: "Возврат", className: "bg-primary/10 text-secondary" },
};

export function StatusChip({
  status,
  pulse = false,
  className,
}: {
  status: Status;
  pulse?: boolean;
  className?: string;
}) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        s.className,
        className,
      )}
    >
      {pulse && (
        <span className="animate-breathe motion-reduce:animate-none size-1.5 rounded-full bg-current" />
      )}
      {s.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Метка «ключ — значение»                                             */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  value,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "brand" | "queued" | "dialing";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[10px] font-bold tracking-wider text-secondary">
        {label}
      </span>
      <span
        className={cn(
          "tnum text-lg font-bold",
          accent === "brand" && "text-brand",
          accent === "queued" && "text-queued",
          accent === "dialing" && "text-dialing",
          !accent && "text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Полоса прогресса                                                    */
/* ------------------------------------------------------------------ */

export function Progress({
  value,
  className,
}: {
  /** 0…1 */
  value: number;
  className?: string;
}) {
  const clamped = Math.min(Math.max(value, 0), 1);
  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-primary/10",
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="animate-progress-grow motion-reduce:animate-none h-full origin-left rounded-full bg-brand"
        style={
          { "--progress": clamped, transform: `scaleX(${clamped})` } as React.CSSProperties
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Скелетон                                                            */
/* ------------------------------------------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-primary/[0.06]",
        className,
      )}
    >
      <div className="animate-skeleton motion-reduce:animate-none absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.07] to-transparent" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Аватар-заглушка: детерминированный градиент по строке                */
/* ------------------------------------------------------------------ */

export function hueFrom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}

export function Avatar({
  seed,
  className,
  rounded = "full",
}: {
  seed: string;
  className?: string;
  rounded?: "full" | "xl";
}) {
  const hue = hueFrom(seed);
  return (
    <span
      aria-hidden="true"
      /* block обязателен: у inline-span ширина и высота игнорируются,
         а аватар встречается и вне флекс-контейнеров */
      className={cn(
        "block shrink-0",
        rounded === "full" ? "rounded-full" : "rounded-xl",
        className,
      )}
      style={{
        background: `linear-gradient(140deg, hsl(${hue} 70% 55%), hsl(${
          (hue + 48) % 360
        } 65% 35%))`,
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Пустое состояние                                                    */
/* ------------------------------------------------------------------ */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/10 px-6 py-16 text-center">
      <span className="text-sm font-bold text-primary">{title}</span>
      <p className="max-w-[42ch] text-sm text-secondary">{description}</p>
      {action}
    </div>
  );
}
