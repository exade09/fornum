export type LegalSection = { title: string; body: string[] };

export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-8 pb-10 lg:px-6">
      <span className="text-sm text-secondary">Legal</span>
      <h1 className="animate-section-in font-display mt-1 text-3xl font-normal tracking-tight text-primary sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-secondary">Updated {updated}</p>
      <p className="mt-6 max-w-[68ch] text-base text-secondary">{intro}</p>

      <div className="mt-10 flex flex-col gap-8">
        {sections.map((s, i) => (
          <article
            key={s.title}
            className="animate-section-in flex gap-4"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className="tnum w-4 shrink-0 pt-1 text-sm text-secondary">
              {i + 1}
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-primary">{s.title}</h2>
              {s.body.map((p, j) => (
                <p key={j} className="max-w-[68ch] text-sm text-secondary">
                  {p}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
