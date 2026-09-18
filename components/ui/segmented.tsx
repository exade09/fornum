"use client";

import { cn } from "@/lib/cn";

export type SegmentOption<T extends string> = {
  id: T;
  label: string;
  hint?: string;
  disabled?: boolean;
};

/**
 * Segmented control with a sliding backdrop. Columns are equal width, so the
 * indicator just moves by index * 100%, no measuring in JS and no jitter on
 * resize
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );

  return (
    <div
      role="tablist"
      className={cn(
        "relative grid w-fit rounded-full bg-background/70 p-1",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-full bg-primary transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={o.disabled}
            onClick={() => onChange(o.id)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 rounded-full whitespace-nowrap transition-colors duration-200",
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
              active
                ? "font-bold text-background"
                : "text-secondary hover:text-primary",
              o.disabled && "cursor-not-allowed opacity-40",
            )}
          >
            {o.label}
            {o.hint && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[9px]",
                  active ? "bg-background/20" : "bg-primary/10",
                )}
              >
                {o.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
