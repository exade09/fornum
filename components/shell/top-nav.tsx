"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CloseIcon,
  FornumMark,
  MenuIcon,
  SearchIcon,
} from "@/components/icons";
import { ConnectWallet } from "@/components/wallet/connect-wallet";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/cn";

/**
 * Navigation lives across the top, so the whole width belongs to content and
 * the sections read as one row rather than a stack down the side
 */
export function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full shrink-0">
        <div className="bar-solid pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
        </div>

        {/* same container as the pages, so the wordmark lines up with content */}
        <div className="mx-auto flex h-[60px] w-full items-center gap-4 px-4 lg:px-6 xl:max-w-7xl">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2 text-primary"
            aria-label="Fornum home"
          >
            <FornumMark className="size-7 transition-transform group-hover:-rotate-6" />
            <span className="text-base font-bold tracking-tight">Fornum</span>
          </Link>

          <span
            aria-hidden="true"
            className="hidden h-6 w-px bg-border nav:block"
          />

          <nav className="hidden items-center gap-0.5 nav:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-card font-bold text-primary"
                      : "text-secondary hover:bg-card/60 hover:text-primary",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <label className="relative hidden h-9 items-center md:flex">
              <SearchIcon className="pointer-events-none absolute left-3 size-4 text-secondary" />
              <span className="sr-only">Search tokens, calls and wallets</span>
              <input
                type="search"
                placeholder="Search"
                className="h-9 w-[180px] rounded-lg border border-primary/[0.06] bg-card pr-3 pl-9 text-sm text-primary transition-[width] duration-200 placeholder:text-secondary focus-visible:w-[260px] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              />
            </label>

            <ConnectWallet className="hidden sm:flex" />

            <Link
              href="/launch"
              className="flex h-9 items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
            >
              Launch
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex size-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-card nav:hidden"
            >
              <MenuIcon className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-70 nav:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          {/* the sheet drops from the top, matching where the bar itself sits */}
          <div className="animate-fade-slide-up absolute inset-x-0 top-0 flex flex-col gap-1 border-b bg-background px-4 pt-4 pb-5">
            <div className="flex h-10 items-center justify-between">
              <span className="flex items-center gap-2 text-primary">
                <FornumMark className="size-7" />
                <span className="text-base font-bold tracking-tight">
                  Fornum
                </span>
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex size-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-card"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-3 transition-colors",
                      active
                        ? "border-primary/20 bg-card"
                        : "border-primary/[0.06] hover:bg-card",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[18px]",
                        active ? "text-brand" : "text-secondary",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm",
                        active
                          ? "font-bold text-primary"
                          : "font-normal text-primary/80",
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            <ConnectWallet className="mt-3 flex justify-center" />
          </div>
        </div>
      )}
    </>
  );
}
