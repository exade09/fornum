/**
 * Минимальный конкатенатор классов — без clsx/tailwind-merge,
 * чтобы не тащить зависимости ради двух строк.
 */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
