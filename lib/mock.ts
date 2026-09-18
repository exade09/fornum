import type { Status } from "@/components/ui/primitives";

/**
 * Демо-данные. Форма объектов совпадает с тем, что потом отдаст
 * ончейн-программа и SSE-стрим — страницы менять не придётся.
 */

export type Agent = "bot" | "human";
export type Kind = "alert" | "gift";

export type Request = {
  id: string;
  pda: string;
  ticker: string;
  name: string;
  kind: Kind;
  agent: Agent;
  status: Status;
  /** сумма в эскроу, USD */
  amount: number;
  /** сколько уже выплачено, USD */
  settled: number;
  queue: number;
  calls: number;
  answered: number;
  phone: string;
  script: string;
  creator: string;
  createdAgo: string;
  tx: string;
};

export const REQUESTS: Request[] = [
  {
    id: "wif-7gk",
    pda: "7GkQmARuK3xy9pLd2V8sNfTcH1bZoW4eXjMv6RsUq5Yn",
    ticker: "WIF",
    name: "dogwifhat",
    kind: "alert",
    agent: "bot",
    status: "dialing",
    amount: 240,
    settled: 128.4,
    queue: 3,
    calls: 600,
    answered: 321,
    phone: "+7 912 ••• 48 21",
    script: "По токену WIF сработал ваш алерт по цене. Проверьте позицию.",
    creator: "4kPq…9xAt",
    createdAgo: "6m",
    tx: "2kpNw7WM75W9tV7XBCYWNmktj3cxV1FSmafg9c3LAVJv",
  },
  {
    id: "bonk-2qp",
    pda: "2QpLxRt8vNcKdF3mZaHbY7wJuE1sPgQ6TiVn4XoBr9Cd",
    ticker: "BONK",
    name: "Bonk",
    kind: "gift",
    agent: "human",
    status: "verifying",
    amount: 48,
    settled: 0,
    queue: 11,
    calls: 1,
    answered: 0,
    phone: "+44 7700 ••• 07",
    script: "Вам отправлены комиссии токена BONK. Подтвердите номер.",
    creator: "9mTz…4kLp",
    createdAgo: "31m",
    tx: "fT9P5tCq5Y3aWpRMoHLjW98rde4tVHuLRDFsBombgG8t",
  },
  {
    id: "pnut-9xc",
    pda: "9XcVbN2mQwErTy6uIoP4aSdFgHjKlZx8CvBnM1qWe3Rt",
    ticker: "PNUT",
    name: "Peanut the Squirrel",
    kind: "alert",
    agent: "bot",
    status: "queued",
    amount: 5,
    settled: 0,
    queue: 7,
    calls: 12,
    answered: 0,
    phone: "+91 98 ••• 33 65",
    script: "Алерт по PNUT: цена прошла ваш уровень.",
    creator: "2vXc…8nQr",
    createdAgo: "12m",
    tx: "5N29kbBzre1p2TSPg6EihHCVEwUfRa4nnutGZQBbpump",
  },
  {
    id: "mew-4rd",
    pda: "4RdTgBnMkLpOiUyTrEwQaZxSvCfDgHjNbVcXm2Qw7Er9",
    ticker: "MEW",
    name: "cat in a dogs world",
    kind: "gift",
    agent: "bot",
    status: "paid",
    amount: 25,
    settled: 25,
    queue: 2,
    calls: 1,
    answered: 1,
    phone: "+1 415 ••• 77 12",
    script: "Поздравляем, вам пришли комиссии токена MEW.",
    creator: "7bNm…3sKd",
    createdAgo: "48m",
    tx: "8deac0d8f83d42d398dfba62555e05daCfB7q78Hz2r5",
  },
  {
    id: "popcat-8kt",
    pda: "8KtYuIoPlKjHgFdSaZxCvBnM4qWeRtYu7IoPl2KjHgFd",
    ticker: "POPCAT",
    name: "Popcat",
    kind: "alert",
    agent: "human",
    status: "dialing",
    amount: 960,
    settled: 402,
    queue: 19,
    calls: 800,
    answered: 335,
    phone: "+62 812 ••• 40 58",
    script: "Алерт по POPCAT: объём вырос за последний час.",
    creator: "5qWe…1rTy",
    createdAgo: "18m",
    tx: "3duNHSCPhFdmhPhKLjUrCWkXMHy52oZ2mSivuSMtkfZq",
  },
  {
    id: "goat-1vz",
    pda: "1VzXcVbNmAsDfGhJkLpQwErTyUiOp3AsDfGhJkLpQwEr",
    ticker: "GOAT",
    name: "Goatseus Maximus",
    kind: "gift",
    agent: "bot",
    status: "paid",
    amount: 10,
    settled: 10,
    queue: 5,
    calls: 1,
    answered: 1,
    phone: "+380 67 ••• 26 74",
    script: "Вам пришли комиссии токена GOAT.",
    creator: "8zXc…6vBn",
    createdAgo: "2h",
    tx: "CQEMNGG7P7W2hYqc1p8DQm5tuvfCFgCXP6coEg4PQQCe",
  },
  {
    id: "slerf-6bn",
    pda: "6BnMkLpOiUyTrEwQaZxSvCfDgHjNbVcXm9QwErTy4Uio",
    ticker: "SLERF",
    name: "Slerf",
    kind: "alert",
    agent: "bot",
    status: "refunded",
    amount: 32,
    settled: 0,
    queue: 14,
    calls: 80,
    answered: 0,
    phone: "+55 11 ••• 13 90",
    script: "Алерт по SLERF.",
    creator: "3rTy…7uIo",
    createdAgo: "3d",
    tx: "GY9mZfyPpxXxBXBxS2hB2XjhP3kfUsywTvgveozxpump",
  },
  {
    id: "moodeng-3ly",
    pda: "3LyKjHgFdSaZxCvBnMqWeRtYuIoPlKjHgFdSaZxCvBn8",
    ticker: "MOODENG",
    name: "Moo Deng",
    kind: "gift",
    agent: "human",
    status: "queued",
    amount: 7.5,
    settled: 0,
    queue: 9,
    calls: 1,
    answered: 0,
    phone: "+49 151 ••• 85 33",
    script: "Вам отправлены комиссии токена MOODENG.",
    creator: "6yUi…2oPl",
    createdAgo: "1h",
    tx: "4kAWN2JTgXAdp5e9MuHV7dv2koLbQsohVZrTL4ovkXFV",
  },
  {
    id: "wen-5df",
    pda: "5DfGhJkLpQwErTyUiOpAsDfGhJkLpQwErTyUiOp1AsDf",
    ticker: "WEN",
    name: "Wen",
    kind: "alert",
    agent: "bot",
    status: "paid",
    amount: 120,
    settled: 120,
    queue: 1,
    calls: 300,
    answered: 188,
    phone: "+34 61 ••• 62 19",
    script: "Алерт по WEN: сработал ваш порог.",
    creator: "1aSd…5fGh",
    createdAgo: "5h",
    tx: "HLX1c9YFd1HyZma2g18ZppoRUxoUNzkitd1HMGRgseGA",
  },
];

export function getRequest(id: string) {
  return REQUESTS.find((r) => r.id === id);
}

/* ------------------------------------------------------------------ */

export type Payout = {
  amount: number;
  phone: string;
  ago: string;
  ticker: string;
  receipt: string;
};

export const PAYOUTS: Payout[] = [
  { amount: 50, phone: "+7 912 ••• 48 21", ago: "2m", ticker: "WIF", receipt: "CfB7q78Hz2r51J8hXU3pF" },
  { amount: 25, phone: "+44 7700 ••• 07", ago: "14m", ticker: "MEW", receipt: "CfB7q77o4KAmsjfYoLZQi" },
  { amount: 10, phone: "+91 98 ••• 33 65", ago: "31m", ticker: "PNUT", receipt: "CfB7q6vtj4wkNfswvPW91" },
  { amount: 5, phone: "+1 415 ••• 77 12", ago: "1h", ticker: "GOAT", receipt: "CfB7q6xNyGSH54FFzXGDZ" },
  { amount: 120, phone: "+62 812 ••• 40 58", ago: "2h", ticker: "POPCAT", receipt: "CfB7q6vdtpmmWtCssq57p" },
  { amount: 15, phone: "+380 67 ••• 26 74", ago: "4h", ticker: "BONK", receipt: "CfB7q6tQWJ1LXFzrgRGco" },
  { amount: 8, phone: "+55 11 ••• 13 90", ago: "5h", ticker: "SLERF", receipt: "CfB7q6sKmN2pQrStUvWxY" },
  { amount: 64, phone: "+49 151 ••• 85 33", ago: "7h", ticker: "MOODENG", receipt: "CfB7q6rJlM1oPqRsTuVwX" },
  { amount: 30, phone: "+34 61 ••• 62 19", ago: "9h", ticker: "WEN", receipt: "CfB7q6qIkL0nOpQrStUvW" },
  { amount: 12, phone: "+81 90 ••• 04 47", ago: "11h", ticker: "WIF", receipt: "CfB7q6pHjK9mNoPqRsTuV" },
  { amount: 240, phone: "+971 50 ••• 19 03", ago: "14h", ticker: "POPCAT", receipt: "CfB7q6oGiJ8lMnOpQrStU" },
  { amount: 6, phone: "+48 60 ••• 77 41", ago: "18h", ticker: "PNUT", receipt: "CfB7q6nFhI7kLmNoPqRsT" },
];

/* ------------------------------------------------------------------ */

export type Profile = {
  handle: string;
  name: string;
  wallet: string;
  verified: boolean;
  bio: string;
  received: number;
  requests: number;
  numbers: { masked: string; confirmedAgo: string; active: boolean }[];
};

export const PROFILES: Profile[] = [
  {
    handle: "4kPq9xAt",
    name: "Ledger Cat",
    wallet: "4kPqR7sT9xAtBcDeFgHiJkLmNoPqRsTuVwXyZ1a2b3c",
    verified: true,
    bio: "Гоняю алерты по мемкоинам. Все звонки — только на подтверждённые номера.",
    received: 109243.51,
    requests: 266,
    numbers: [
      { masked: "+7 912 ••• 48 21", confirmedAgo: "3 дня назад", active: true },
      { masked: "+44 7700 ••• 07", confirmedAgo: "2 недели назад", active: true },
      { masked: "+91 98 ••• 33 65", confirmedAgo: "1 месяц назад", active: false },
    ],
  },
];

export function getProfile(handle: string) {
  return PROFILES.find((p) => p.handle === handle) ?? PROFILES[0];
}

/* ------------------------------------------------------------------ */

/** Раскладка аккаунта заявки в программе. */
export const ACCOUNT_LAYOUT = [
  { off: 0, len: 8, field: "discriminator" },
  { off: 8, len: 32, field: "creator" },
  { off: 40, len: 32, field: "recipient hash" },
  { off: 72, len: 8, field: "amount lamports" },
  { off: 80, len: 1, field: "kind" },
  { off: 81, len: 1, field: "agent" },
  { off: 82, len: 4, field: "queue index" },
  { off: 86, len: 1, field: "status" },
];

/** Поля для превью на лендинге — короткие, чтобы влезали в плитку. */
export const DEMO_REQUESTS = REQUESTS.map((r) => ({
  id: r.id,
  ticker: r.ticker,
  name: r.name,
  kind: r.kind,
  agent: r.agent,
  amount: usd(r.amount, r.amount % 1 === 0 ? 0 : 2),
  queue: r.queue,
}));

export const DEMO_PAYOUTS = PAYOUTS.slice(0, 10).map((p) => ({
  amount: `$${p.amount.toFixed(2)}`,
  phone: p.phone,
  ago: p.ago,
  ticker: p.ticker,
}));

export function usd(value: number, fraction = 2) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  })}`;
}
