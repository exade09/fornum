/**
 * Minimal class joiner. No clsx or tailwind-merge, not worth a dependency
 * for two lines
 */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
