import Link from "next/link";
import { HomeBento, LiveCallBadge } from "@/components/home/bento";
import { Card } from "@/components/ui/primitives";
import { WhatsAppIcon, PhoneIcon, CheckIcon } from "@/components/icons";

const SCENARIOS = [
  {
    icon: PhoneIcon,
    title: "Алерт по токену",
    text: "Подписчики оставляют номер и подтверждают его сами. Когда по токену срабатывает условие, им уходит звонок. Заявка на обзвон встаёт в общую очередь, оплата держится в эскроу до факта дозвона.",
  },
  {
    icon: WhatsAppIcon,
    title: "Перевод комиссий",
    text: "Указываете номер получателя и сумму из комиссий токена. Получателю приходит звонок с сообщением о переводе, он подтверждает номер и забирает выплату — с публичным чеком.",
  },
  {
    icon: CheckIcon,
    title: "Согласие вместо холодных звонков",
    text: "Звонок физически не может уйти на номер без активного согласия. Если согласия нет или дозвона не случилось, эскроу возвращается создателю заявки целиком.",
  },
];

export default function HomePage() {
  return (
    <>
      <div className="pt-8 sm:pt-14">
        <section className="animate-section-in mx-auto flex w-full flex-col items-center gap-6 px-4 pb-12 text-center lg:px-6 xl:max-w-7xl">
          <LiveCallBadge />

          <h1 className="shimmer-text motion-reduce:animate-none max-w-[17ch] font-display text-4xl leading-[1.04] font-normal tracking-tight sm:text-5xl md:text-6xl">
            Звонок в WhatsApp, оплаченный ончейн
          </h1>

          <p className="max-w-[56ch] text-base text-secondary sm:text-lg">
            Ставите заявку в очередь — контракт держит сумму в эскроу. Робот или
            живой оператор звонит только на номер, который сам подтвердился.
            Статус, позиция и подтверждение выплаты видны всем.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href="/create"
              className="border-beam flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
            >
              Создать заявку
            </Link>
            <Link
              href="/docs"
              className="flex h-11 items-center rounded-full border px-6 text-sm font-bold text-primary transition-colors hover:bg-card"
            >
              Как это работает
            </Link>
          </div>
        </section>
      </div>

      <HomeBento />

      <section className="mx-auto w-full px-4 pt-20 pb-10 lg:px-6 xl:max-w-7xl">
        <div className="animate-section-in flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-2xl font-normal tracking-tight text-primary">
              Как устроен Fornum
            </h2>
            <p className="max-w-[62ch] text-sm text-secondary">
              Три правила, на которых держится всё остальное.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {SCENARIOS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Card
                  key={s.title}
                  lift
                  sheen
                  className="animate-card-in motion-reduce:animate-none flex flex-col gap-3 p-5"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand/15">
                    <Icon className="size-4.5 text-brand" />
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {s.title}
                  </span>
                  <p className="text-sm text-secondary">{s.text}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
