/**
 * Inner page header: one card with a title, a line of context and an optional
 * action on the right
 */
export function PageHero({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="animate-section-in mx-auto w-full px-4 pt-6 lg:px-6 xl:max-w-7xl">
      <div className="relative overflow-hidden rounded-2xl border border-primary/[0.06] bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-2xl font-normal text-primary sm:text-3xl">
              {title}
            </h1>
            <p className="max-w-[62ch] text-sm text-secondary sm:text-base">
              {description}
            </p>
          </div>
          {action}
        </div>
      </div>
    </section>
  );
}

/** A plain status line instead of a spinner */
export function StaleNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto w-full px-4 pt-6 text-sm text-secondary lg:px-6 xl:max-w-7xl">
      {children}
    </p>
  );
}
