import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-4 py-32 text-center lg:px-6">
      <span className="tnum font-display animate-section-in text-6xl font-normal tracking-tight text-primary">
        404
      </span>
      <p className="max-w-[44ch] text-sm text-secondary">
        Такой заявки нет — возможно, она уже закрыта и эскроу вернулся
        создателю.
      </p>
      <Link
        href="/queue"
        className="mt-2 flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
      >
        В очередь заявок
      </Link>
    </div>
  );
}
