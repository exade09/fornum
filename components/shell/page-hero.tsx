/**
 * Inner page header. A plain block with a rule under it rather than a card, so
 * the first real card on the page is the content and not the title
 */
export function PageHero({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="mx-auto w-full px-4 pt-10 lg:px-6 xl:max-w-7xl">
      <div className="animate-section-in flex flex-col gap-5 border-b pb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            {eyebrow && (
              <span className="text-[11px] font-bold tracking-[0.12em] text-brand uppercase">
                {eyebrow}
              </span>
            )}
            <h1 className="font-display text-3xl font-normal tracking-tight text-primary sm:text-[40px] sm:leading-[1.05]">
              {title}
            </h1>
          </div>
          {action}
        </div>

        <p className="max-w-[64ch] text-sm text-secondary sm:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}

/** A plain status line instead of a spinner */
export function StaleNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto w-full px-4 pt-5 text-sm text-secondary lg:px-6 xl:max-w-7xl">
      {children}
    </p>
  );
}
