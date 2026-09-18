import type { Metadata } from "next";
import { ACCOUNT_LAYOUT } from "@/lib/mock";

export const metadata: Metadata = { title: "Docs" };

const SECTIONS = [
  {
    t: "Что делает Fornum",
    d: "Fornum — очередь звонков, оплаченная ончейн. Заявка создаётся на сайте, сумма замораживается в программе, исполнитель звонит на подтверждённый номер, эскроу раскрывается по факту дозвона.",
  },
  {
    t: "Подтверждение номера",
    d: "Звонок уходит только на номер, владелец которого подтвердил согласие. Подтверждение делается один раз и живёт в аккаунте получателя; отозвать его можно в любой момент на странице opt-out.",
  },
  {
    t: "Алерт по токену",
    d: "Подписчики привязывают номер к токену. Когда срабатывает условие, заявка на обзвон ставится в очередь. Обзвон идёт только по списку подтверждённых подписчиков этого токена.",
  },
  {
    t: "Перевод комиссий",
    d: "Создатель указывает номер получателя и сумму. Получателю уходит звонок с сообщением о переводе, он подтверждает номер и забирает выплату.",
  },
  {
    t: "Исполнители",
    d: "Робот озвучивает текст заявки синтезом. Живой оператор читает тот же текст — тариф выше, дозвон надёжнее. Выбор фиксируется в аккаунте заявки полем agent.",
  },
  {
    t: "Очередь",
    d: "Позиция — поле queue index в аккаунте заявки. Фронт подписан на onProgramAccountChange и перерисовывает очередь без опроса.",
  },
  {
    t: "Приватность номеров",
    d: "В аккаунт пишется только хеш номера с солью. Сопоставление номера и хеша живёт вне цепочки и доступно исполнителю звонка на время выполнения заявки.",
  },
  {
    t: "Возвраты",
    d: "Если дозвона не было или получатель не подтвердил номер до истечения срока, эскроу возвращается создателю целиком, за вычетом комиссии сети.",
  },
];

export default function DocsPage() {
  return (
    <section className="mx-auto w-full px-4 pt-8 pb-10 lg:px-6 xl:max-w-4xl">
      <span className="text-sm text-secondary">Docs</span>
      <h1 className="font-display mt-1 text-3xl font-normal text-primary sm:text-4xl">
        Как работает Fornum
      </h1>
      <p className="mt-4 max-w-[68ch] text-base text-secondary">
        Заявка на звонок живёт в программе Solana: эскроу, очередь и статус
        читаются из цепочки. Звонок уходит только на подтверждённый номер.
      </p>

      <nav className="mt-8">
        <span className="text-[10px] font-bold tracking-wider text-secondary">
          СОДЕРЖАНИЕ
        </span>
        <ol className="mt-3 grid gap-x-10 gap-y-2 sm:grid-cols-2">
          {SECTIONS.map((s, i) => (
            <li key={s.t} className="flex gap-3 text-sm">
              <span className="tnum w-4 shrink-0 text-secondary">{i + 1}</span>
              <a
                href={`#s${i + 1}`}
                className="text-primary/80 transition-colors hover:text-primary"
              >
                {s.t}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 flex flex-col gap-8">
        {SECTIONS.map((s, i) => (
          <article key={s.t} id={`s${i + 1}`} className="flex gap-4">
            <span className="tnum w-4 shrink-0 pt-1 text-sm text-secondary">
              {i + 1}
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-primary">{s.t}</h2>
              <p className="max-w-[68ch] text-sm text-secondary">{s.d}</p>
            </div>
          </article>
        ))}

        <article className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-primary">Аккаунт заявки</h2>
          <div className="overflow-hidden rounded-xl border border-primary/[0.06] bg-card font-mono text-xs">
            <div className="flex gap-4 border-b border-primary/[0.06] px-4 py-2 text-[10px] text-secondary">
              <span className="w-10">OFF</span>
              <span className="w-10">LEN</span>
              <span>FIELD</span>
            </div>
            {ACCOUNT_LAYOUT.map((r) => (
              <div key={r.off} className="flex gap-4 px-4 py-1.5 text-primary/80">
                <span className="tnum w-10 text-secondary">{r.off}</span>
                <span className="tnum w-10 text-secondary">{r.len}</span>
                <span>{r.field}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
