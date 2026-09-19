import { cn } from "@/lib/cn";
import type { CallStatus, TokenStatus } from "@/lib/data";

/* ------------------------------------------------------------------ */
/* Card                                                                */
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
/* Status chips                                                        */
/* ------------------------------------------------------------------ */

const CALL_STATUS: Record<CallStatus, { label: string; className: string }> = {
  queued: { label: "In queue", className: "bg-queued/15 text-queued" },
  verifying: { label: "Confirming", className: "bg-warning/15 text-warning" },
  dialing: { label: "On the call", className: "bg-dialing/15 text-dialing" },
  answered: { label: "Answered", className: "bg-brand/15 text-brand" },
  missed: { label: "No answer", className: "bg-primary/10 text-secondary" },
};

export function CallChip({
  status,
  className,
}: {
  status: CallStatus;
  className?: string;
}) {
  const s = CALL_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        s.className,
        className,
      )}
    >
      {status === "dialing" && (
        <span className="animate-breathe motion-reduce:animate-none size-1.5 rounded-full bg-current" />
      )}
      {s.label}
    </span>
  );
}

const TOKEN_STATUS: Record<TokenStatus, { label: string; className: string }> =
  {
    live: { label: "Live", className: "bg-brand/15 text-brand" },
    graduated: { label: "Graduated", className: "bg-dialing/15 text-dialing" },
    pending: { label: "Fees waiting", className: "bg-queued/15 text-queued" },
  };

export function TokenChip({
  status,
  className,
}: {
  status: TokenStatus;
  className?: string;
}) {
  const s = TOKEN_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
        s.className,
        className,
      )}
    >
      {s.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Label and value                                                     */
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
      <span className="text-[10px] font-bold tracking-wider text-secondary uppercase">
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
/* Progress                                                            */
/* ------------------------------------------------------------------ */

export function Progress({
  value,
  className,
}: {
  /** 0 to 1 */
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
          {
            "--progress": clamped,
            transform: `scaleX(${clamped})`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
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
/* Empty state                                                         */
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
      <p className="max-w-[46ch] text-sm text-secondary">{description}</p>
      {action}
    </div>
  );
}
