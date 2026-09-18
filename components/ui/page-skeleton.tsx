import { Card, Skeleton } from "@/components/ui/primitives";

/** Placeholder for an inner page: header plus a grid of cards */
export function PageSkeleton({
  cards = 6,
  columns = "sm:grid-cols-2 xl:grid-cols-3",
}: {
  cards?: number;
  columns?: string;
}) {
  return (
    <div className="mx-auto w-full px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
      <Card className="flex flex-col gap-4 p-6 sm:p-8">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-full max-w-[52ch]" />
        <Skeleton className="h-4 w-full max-w-[38ch]" />
      </Card>

      <div className={`mt-6 grid gap-3 ${columns}`}>
        {Array.from({ length: cards }, (_, i) => (
          <Card key={i} className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-end justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-12" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
