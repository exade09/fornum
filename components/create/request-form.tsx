"use client";

import { useState } from "react";
import { CheckIcon, PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { Waveform } from "@/components/ui/waveform";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";

type Kind = "alert" | "gift";
type Agent = "bot" | "human";

const KIND_TABS: { id: Kind; label: string; hint: string }[] = [
  {
    id: "alert",
    label: "Алерт по токену",
    hint: "Звонок подписчикам, которые сами подтвердили номер.",
  },
  {
    id: "gift",
    label: "Перевод комиссий",
    hint: "Отправить комиссии токена на номер получателя.",
  },
];

const AGENTS: { id: Agent; label: string; price: string }[] = [
  { id: "bot", label: "Робот", price: "$0.40 / звонок" },
  { id: "human", label: "Живой оператор", price: "$1.20 / звонок" },
];

export function RequestForm() {
  const [kind, setKind] = useState<Kind>("alert");
  const [agent, setAgent] = useState<Agent>("bot");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("25");
  const [script, setScript] = useState(
    "Привет! По токену WIF сработал ваш алерт по цене.",
  );

  const active = KIND_TABS.find((t) => t.id === kind)!;
  const verified = phone.replace(/\D/g, "").length >= 11;

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ---------------- форма ---------------- */}
      <form
        className="flex flex-col gap-5 rounded-2xl border border-primary/[0.06] bg-card p-5 sm:p-6"
        onSubmit={(e) => e.preventDefault()}
      >
        <h2 className="font-display text-xl font-normal text-primary">
          Новая заявка
        </h2>

        {/* табы сценария */}
        <Segmented<Kind>
          value={kind}
          onChange={setKind}
          options={KIND_TABS.map((t) => ({ id: t.id, label: t.label }))}
        />

        <p className="-mt-2 text-xs text-secondary">{active.hint}</p>

        {/* исполнитель */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-[10px] font-bold tracking-wider text-secondary">
            КТО ЗВОНИТ
          </legend>
          <div className="flex flex-wrap gap-2">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAgent(a.id)}
                aria-pressed={agent === a.id}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
                  agent === a.id
                    ? "border-primary/30 bg-background/70 text-primary"
                    : "border-primary/[0.06] text-secondary hover:text-primary",
                )}
              >
                <PhoneIcon
                  className={cn(
                    "size-4",
                    agent === a.id ? "text-brand" : "text-secondary",
                  )}
                />
                {a.label}
                <span className="tnum text-xs text-secondary">{a.price}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* номер */}
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-bold tracking-wider text-secondary">
            НОМЕР ПОЛУЧАТЕЛЯ
          </span>
          <span className="relative flex h-11 items-center">
            <WhatsAppIcon className="absolute left-4 size-4 text-brand" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="+7 912 345 48 21"
              className="tnum h-11 w-full rounded-full border border-primary/[0.06] bg-field pr-4 pl-11 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
          </span>
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs",
              verified ? "text-brand" : "text-secondary",
            )}
          >
            {verified && <CheckIcon className="size-3.5" />}
            {verified
              ? "Номер получит запрос на подтверждение — звонок уйдёт только после согласия."
              : "Звонок уходит только на номер, который подтвердил согласие."}
          </span>
        </label>

        {/* сумма */}
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-bold tracking-wider text-secondary">
            {kind === "gift" ? "СУММА ПЕРЕВОДА" : "БЮДЖЕТ ОБЗВОНА"}
          </span>
          <span className="relative flex h-11 items-center">
            <span className="absolute left-4 text-sm text-secondary">$</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="tnum h-11 w-full rounded-full border border-primary/[0.06] bg-field pr-4 pl-8 text-sm text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
          </span>
        </label>

        {/* текст */}
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-bold tracking-wider text-secondary">
            ЧТО СКАЗАТЬ
          </span>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={3}
            className="rounded-xl border border-primary/[0.06] bg-field p-3 text-sm text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          />
          <span className="text-xs text-secondary">
            Текст уходит в очередь вместе с заявкой и виден в её карточке.
          </span>
        </label>

        <button
          type="submit"
          className="flex h-11 w-fit items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
        >
          Поставить в очередь
        </button>
      </form>

      {/* ---------------- превью ---------------- */}
      <aside className="flex h-fit flex-col gap-3">
        <div className="animate-pop-in motion-reduce:animate-none rounded-2xl border border-primary/[0.06] bg-card p-4">
          <div className="flex items-center gap-3">
            <span className="relative flex size-10 items-center justify-center rounded-full bg-brand/15">
              <span className="animate-ring-pulse motion-reduce:animate-none absolute size-10 rounded-full bg-brand/40" />
              <PhoneIcon className="size-5 text-brand" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold text-primary">
                Входящий звонок
              </span>
              <span className="tnum truncate text-xs text-secondary">
                {phone || "+7 912 345 48 21"}
              </span>
            </div>
          </div>

          <p className="mt-3 line-clamp-3 text-xs text-secondary">{script}</p>

          <Waveform className="mt-3 h-8" bars={28} />
        </div>

        <div className="rounded-2xl border border-primary/[0.06] bg-card p-4 text-xs text-secondary">
          <span className="text-sm font-bold text-primary">Что дальше</span>
          <ol className="mt-2 flex flex-col gap-1.5">
            <li>1. Сумма уходит в эскроу контракта.</li>
            <li>2. Заявка встаёт в общую очередь, позиция видна всем.</li>
            <li>3. Получатель подтверждает номер в WhatsApp.</li>
            <li>
              4. {agent === "human" ? "Оператор" : "Робот"} звонит, эскроу
              раскрывается по факту.
            </li>
          </ol>
        </div>
      </aside>
    </div>
  );
}
