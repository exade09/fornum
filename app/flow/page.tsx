import type { Metadata } from "next";
import { PageHero } from "@/components/shell/page-hero";

export const metadata: Metadata = { title: "Flow" };

const NODES = [
  { x: 60, label: "Заявка", sub: "форма на сайте" },
  { x: 230, label: "Эскроу", sub: "средства заморожены" },
  { x: 400, label: "Очередь", sub: "позиция ончейн" },
  { x: 570, label: "Подтверждение", sub: "получатель согласился" },
  { x: 740, label: "Звонок", sub: "робот или оператор" },
  { x: 910, label: "Выплата", sub: "эскроу раскрыт" },
];

export default function FlowPage() {
  return (
    <>
      <PageHero
        title="Поток средств"
        description="Деньги не двигаются, пока получатель не подтвердил номер, а звонок не состоялся. Каждый шаг — отдельная инструкция в программе."
      />

      <section className="mx-auto w-full px-4 pt-6 pb-10 lg:px-6 xl:max-w-7xl">
        <div className="animate-section-in overflow-x-auto rounded-2xl border border-primary/[0.06] bg-card p-6">
          <svg
            viewBox="0 0 990 160"
            className="h-40 min-w-[900px] w-full"
            role="img"
            aria-label="Схема: заявка, эскроу, очередь, подтверждение, звонок, выплата"
          >
            {NODES.slice(0, -1).map((n, i) => (
              <line
                key={i}
                x1={n.x + 28}
                y1={62}
                x2={NODES[i + 1].x - 28}
                y2={62}
                className="animate-dash motion-reduce:animate-none"
                stroke="hsl(var(--primary) / 0.28)"
                strokeWidth="1.5"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}

            {NODES.map((n) => (
              <g key={n.label}>
                <circle
                  cx={n.x}
                  cy={62}
                  r={26}
                  fill="hsl(var(--background))"
                  stroke="hsl(var(--primary) / 0.16)"
                />
                <circle cx={n.x} cy={62} r={6} fill="hsl(var(--brand))" />
                <text
                  x={n.x}
                  y={108}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="hsl(var(--primary))"
                >
                  {n.label}
                </text>
                <text
                  x={n.x}
                  y={126}
                  textAnchor="middle"
                  fontSize="10"
                  fill="hsl(var(--secondary))"
                >
                  {n.sub}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            {
              t: "Эскроу",
              d: "Сумма лежит в PDA заявки. Создатель может отозвать её, пока звонок не начат.",
            },
            {
              t: "Подтверждение",
              d: "Номер хранится хешем. В открытом виде он не попадает ни в аккаунт, ни в логи.",
            },
            {
              t: "Раскрытие",
              d: "Эскроу раскрывается только после отметки о дозвоне. Недозвон возвращает средства.",
            },
          ].map((c) => (
            <article
              key={c.t}
              className="rounded-2xl border border-primary/[0.06] bg-card p-5"
            >
              <span className="text-sm font-bold text-primary">{c.t}</span>
              <p className="mt-1 text-sm text-secondary">{c.d}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
