"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  MenuIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { siteConfig } from "@/lib/config";
import { Brand } from "@/components/shell/brand";
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
export function SideNav({ account }: { account: string | null }) {
  const isActive = useIsActive();

  return (
    <aside className="sticky top-0 z-50 hidden h-svh w-[260px] shrink-0 flex-col border-r bg-background nav:flex">
      <Link
        href="/"
        className="group flex h-[68px] shrink-0 items-center gap-2.5 px-5 pb-1 text-primary"
        aria-label="Fornum home"
      >
        <Brand
          size={28}
          className="transition-transform group-hover:-rotate-3"
        />
        <span className="text-base font-bold tracking-tight">Fornum</span>
      </Link>

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
        <NumberRow />

        <AccountRow account={account} />

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
export function MobileNav({ account }: { account: string | null }) {
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

            <div className="mt-auto">
              <AccountRow account={account} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** The line everything runs through, always in reach */
function NumberRow() {
  const { display, e164 } = siteConfig.whatsapp;

  return (
    <a
      href={`https://wa.me/${e164}?text=LAUNCH`}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-2 rounded-lg px-1 py-1 text-xs transition-colors"
    >
      <span className="relative flex size-2 shrink-0 items-center justify-center">
        <span className="animate-ring-pulse motion-reduce:animate-none absolute size-2 rounded-full bg-brand" />
        <span className="size-2 rounded-full bg-brand" />
      </span>
      <WhatsAppIcon className="size-3.5 shrink-0 text-brand" />
      <span className="tnum truncate text-secondary transition-colors group-hover:text-primary">
        {display}
      </span>
    </a>
  );
}

/**
 * The account plate, present whether or not anyone is signed in, so the column
 * always ends the same way
 */
function AccountRow({ account }: { account: string | null }) {
  if (!account) {
    return (
      <Link
        href="/signin"
        className="group flex items-center gap-2.5 rounded-xl border border-primary/[0.06] bg-card px-3 py-2.5 transition-colors hover:border-primary/20"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background/70 ring-1 ring-primary/[0.08]">
          <WhatsAppIcon className="size-4 text-secondary" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-bold text-primary">
            Not signed in
          </span>
          <span className="truncate text-[11px] text-secondary">
            Use your phone number
          </span>
        </span>
        <ChevronRightIcon className="ml-auto size-4 shrink-0 text-secondary transition-transform group-hover:translate-x-0.5" />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-primary/[0.06] bg-card px-3 py-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15">
        <CheckIcon className="size-4 text-brand" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="tnum truncate text-xs font-bold text-primary">
          {account}
        </span>
        <span className="truncate text-[11px] text-secondary">Signed in</span>
      </span>
      <form action="/api/auth/signout" method="post" className="ml-auto">
        <button
          type="submit"
          className="text-[11px] text-secondary transition-colors hover:text-primary"
        >
          Out
        </button>
      </form>
    </div>
  );
}
