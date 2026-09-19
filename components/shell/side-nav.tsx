"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon, PhoneIcon, SearchIcon } from "@/components/icons";
import { Brand } from "@/components/shell/brand";
import { ConnectWallet } from "@/components/wallet/connect-wallet";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/cn";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Everything the chrome needs lives in one column on the left: brand, search,
 * sections, wallet and the launch button. There is no bar across the top, so
 * every page starts at its own title
 */
export function SideNav({ queued }: { queued: number }) {
  const isActive = useIsActive();

  return (
    <aside className="sticky top-0 z-50 hidden h-svh w-[260px] shrink-0 flex-col border-r bg-background nav:flex">
      <Link
        href="/"
        className="group flex h-[68px] shrink-0 items-center gap-2.5 px-5 text-primary"
        aria-label="Fornum home"
      >
        <Brand
          size={28}
          className="transition-transform group-hover:-rotate-3"
        />
        <span className="text-base font-bold tracking-tight">Fornum</span>
      </Link>

      <div className="px-4 pb-4">
        <label className="relative flex h-9 items-center">
          <SearchIcon className="pointer-events-none absolute left-3 size-4 text-secondary" />
          <span className="sr-only">Search tokens, calls and wallets</span>
          <input
            type="search"
            placeholder="Search"
            className="h-9 w-full rounded-lg border border-primary/[0.06] bg-card pr-3 pl-9 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          />
        </label>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-card font-bold text-primary"
                  : "text-secondary hover:bg-card/60 hover:text-primary",
              )}
            >
              <Icon
                className={cn(
                  "size-[18px] shrink-0",
                  active ? "text-brand" : "text-secondary",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 flex-col gap-2 border-t px-4 py-4">
        <Link
          href="/queue"
          className="group mb-1 flex items-center gap-2 rounded-lg px-1 py-1 text-xs text-secondary transition-colors hover:text-primary"
        >
          <span className="relative flex size-2 items-center justify-center">
            <span className="animate-ring-pulse motion-reduce:animate-none absolute size-2 rounded-full bg-brand" />
            <span className="size-2 rounded-full bg-brand" />
          </span>
          <PhoneIcon className="size-3.5 text-brand" />
          <span className="tnum">{queued} in the queue</span>
        </Link>

        <ConnectWallet className="flex w-full justify-center" />

        <Link
          href="/launch"
          className="flex h-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-background transition-colors hover:bg-primary-hover"
        >
          Launch a token
        </Link>
      </div>
    </aside>
  );
}

/**
 * Under the nav breakpoint the column folds into a slim bar, and the same
 * sections open as a sheet from the left, the side the nav lives on
 */
export function MobileNav() {
  const pathname = usePathname();
  const isActive = useIsActive();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center gap-3 px-4 nav:hidden">
        <div className="bar-solid pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 text-primary"
          aria-label="Fornum home"
        >
          <Brand size={24} />
          <span className="text-sm font-bold tracking-tight">Fornum</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/launch"
            className="flex h-9 items-center rounded-full bg-primary px-4 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
          >
            Launch
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="flex size-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-card"
          >
            <MenuIcon className="size-5" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-70 nav:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="animate-slide-in-left absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r bg-background px-4 pt-4 pb-5">
            <div className="flex h-10 shrink-0 items-center justify-between">
              <span className="flex items-center gap-2 text-primary">
                <Brand size={24} />
                <span className="text-sm font-bold tracking-tight">Fornum</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex size-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-card"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-0.5">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                      active
                        ? "bg-card font-bold text-primary"
                        : "text-secondary hover:bg-card/60 hover:text-primary",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0",
                        active ? "text-brand" : "text-secondary",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <ConnectWallet className="mt-auto flex w-full justify-center" />
          </div>
        </div>
      )}
    </>
  );
}
