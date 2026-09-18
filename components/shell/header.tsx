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

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // close the drawer on navigation and lock the page behind it
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center gap-4 px-4 lg:px-6">
        {/* backdrop plus a hairline instead of a border, so the height never shifts */}
        <div className="bar-solid pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
        </div>

        <Link
          href="/"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-background-hover/40 nav:hidden"
          aria-label="Fornum home"
        >
          <FornumMark className="size-7" />
        </Link>

        {/* left spacer keeps the search box centered in the row */}
        <div className="hidden flex-1 lg:block" />

        <div className="hidden min-w-0 flex-[2] justify-center lg:flex">
          <label className="relative flex h-11 w-full max-w-[560px] items-center">
            <SearchIcon className="pointer-events-none absolute left-4 size-4 text-secondary" />
            <span className="sr-only">Search tokens, calls and wallets</span>
            <input
              type="search"
              placeholder="Search tokens, calls, wallets"
              className="h-11 w-full rounded-full bg-card pr-4 pl-11 text-sm text-primary placeholder:text-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            />
          </label>
        </div>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <Link
            href="/launch"
            className="flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-background transition-colors hover:bg-primary-hover"
          >
            Launch
          </Link>
          <ConnectWallet className="hidden sm:flex" />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex size-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-card nav:hidden"
          >
            <MenuIcon className="size-6" />
          </button>
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
          <div className="animate-fade-slide-up absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] flex-col gap-1 border-r bg-background px-3 py-4">
            <div className="flex h-12 items-center justify-between px-2">
              <FornumMark className="size-7 text-primary" />
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex size-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-card"
              >
                <CloseIcon className="size-5" />
              </button>
            </div>

            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 rounded-full px-3 py-3 transition-colors hover:bg-card"
                >
                  <Icon
                    className={cn(
                      "size-[22px]",
                      active ? "text-primary" : "text-primary/70",
                    )}
                  />
                  <span
                    className={cn(
                      "text-lg",
                      active
                        ? "font-bold text-primary"
                        : "font-normal text-primary/70",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}

            <ConnectWallet className="mt-2 flex justify-center" />
          </div>
        </div>
      )}
    </>
  );
}
