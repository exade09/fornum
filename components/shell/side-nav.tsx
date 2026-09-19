"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CheckIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  CloseIcon,
  CreateIcon,
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
 * Nav row geometry, shared by the column and the mobile sheet
 *
 * A 50px row with a 20px icon and a 16px gap. Nothing marks the active row with
 * a filled pill: it is carried by weight, by full strength colour and by a
 * hairline rule, which keeps the column quiet when four rows are visible at once
 */
const ROW =
  "group focus-ring relative flex h-[50px] items-center gap-4 rounded-[22px] text-base transition-colors";
const ICON =
  "size-5 shrink-0 transition-transform duration-300 group-hover:scale-110 motion-reduce:group-hover:scale-100";

/** The rule that says which row you are on. Vertical in the column, underneath in the rail */
function ActiveRule({ railed }: { railed: boolean }) {
  return (
    <span
      className={cn(
        "absolute rounded-full bg-brand",
        railed
          ? "inset-x-3 bottom-1 h-0.5"
          : "top-1/2 left-0 h-5 w-0.5 -translate-y-1/2",
      )}
    />
  );
}

/**
 * Everything the chrome needs lives in one column on the left: brand, sections,
 * the number, the account and the launch button. There is no bar across the
 * top, so every page starts at its own title
 *
 * The column folds to a 64px rail, and the choice is kept in a cookie rather
 * than in localStorage so the server renders the width the visitor last chose
 * and the layout never jumps on load
 */
export function SideNav({
  account,
  defaultRailed,
}: {
  account: string | null;
  defaultRailed: boolean;
}) {
  const isActive = useIsActive();
  const [railed, setRailed] = useState(defaultRailed);

  function toggle() {
    const next = !railed;
    setRailed(next);
    document.cookie = `fornum_nav=${next ? "rail" : "full"}; path=/; max-age=31536000; samesite=lax`;
  }

  const collapseButton = (
    <button
      type="button"
      onClick={toggle}
      aria-label={railed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!railed}
      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/[0.08] text-secondary transition-colors hover:border-primary/20 hover:text-primary"
    >
      <ChevronsLeftIcon
        className={cn(
          "size-4 transition-transform duration-200",
          railed && "rotate-180",
        )}
      />
    </button>
  );

  return (
    <aside
      className={cn(
        "sticky top-0 z-50 hidden h-svh shrink-0 flex-col border-r bg-background transition-[width] duration-200 nav:flex",
        railed ? "w-16" : "w-[250px]",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center",
          railed ? "h-[52px] justify-center px-0" : "h-16 justify-between px-4",
        )}
      >
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-primary"
          aria-label="Fornum home"
        >
          <Brand
            size={28}
            className="transition-transform group-hover:-rotate-3"
          />
          {!railed && (
            <span className="text-base font-bold tracking-tight">Fornum</span>
          )}
        </Link>
        {!railed && collapseButton}
      </div>

      {railed && <div className="mx-auto mt-1 shrink-0">{collapseButton}</div>}

      <nav
        className={cn(
          "mt-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto",
          railed ? "px-2" : "px-2",
        )}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={railed ? item.label : undefined}
              className={cn(
                ROW,
                railed ? "justify-center px-0" : "px-3",
                active
                  ? "font-medium text-primary"
                  : "text-primary/85 hover:bg-card hover:text-primary",
              )}
            >
              {active && <ActiveRule railed={railed} />}
              <Icon
                className={cn(
                  ICON,
                  active ? "text-primary" : "text-primary/70",
                )}
              />
              <span className={cn(railed && "sr-only")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          "mt-auto flex shrink-0 flex-col gap-2 pb-4",
          railed ? "items-center px-2" : "px-3",
        )}
      >
        <NumberRow railed={railed} />

        <AccountRow account={account} railed={railed} />

        <Link
          href="/launch"
          title={railed ? "Launch a token" : undefined}
          className={cn(
            "flex items-center justify-center bg-primary font-bold text-background transition-colors hover:bg-primary-hover",
            railed
              ? "size-10 rounded-full"
              : "h-10 rounded-full text-sm",
          )}
        >
          {railed ? (
            <CreateIcon className="size-5" />
          ) : (
            "Launch a token"
          )}
          {railed && <span className="sr-only">Launch a token</span>}
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
          <div className="animate-slide-in-left absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r bg-background px-3 pt-4 pb-5">
            <div className="flex h-10 shrink-0 items-center justify-between px-1">
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
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      ROW,
                      "px-3",
                      active
                        ? "font-medium text-primary"
                        : "text-primary/85 hover:bg-card hover:text-primary",
                    )}
                  >
                    {active && <ActiveRule railed={false} />}
                    <Icon
                      className={cn(
                        ICON,
                        active ? "text-primary" : "text-primary/70",
                      )}
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto flex flex-col gap-2 px-1">
              <NumberRow railed={false} />
              <AccountRow account={account} railed={false} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** The line everything runs through, always in reach */
function NumberRow({ railed }: { railed: boolean }) {
  const { display, e164 } = siteConfig.whatsapp;

  const dot = (
    <span className="relative flex size-2 shrink-0 items-center justify-center">
      <span className="animate-ring-pulse motion-reduce:animate-none absolute size-2 rounded-full bg-brand" />
      <span className="size-2 rounded-full bg-brand" />
    </span>
  );

  if (railed) {
    return (
      <a
        href={`https://wa.me/${e164}?text=LAUNCH`}
        target="_blank"
        rel="noreferrer"
        title={display}
        className="relative flex size-10 items-center justify-center rounded-full text-brand transition-colors hover:bg-card"
      >
        <WhatsAppIcon className="size-4" />
        <span className="absolute top-1.5 right-1.5">{dot}</span>
        <span className="sr-only">{display}</span>
      </a>
    );
  }

  return (
    <a
      href={`https://wa.me/${e164}?text=LAUNCH`}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-2 rounded-lg px-1 py-1 text-xs transition-colors"
    >
      {dot}
      <WhatsAppIcon className="size-3.5 shrink-0 text-brand" />
      <span className="tnum truncate text-secondary transition-colors group-hover:text-primary">
        {display}
      </span>
    </a>
  );
}

/**
 * The account plate, present whether or not anyone is signed in, so the column
 * always ends the same way. In the rail it keeps only the mark, and signing out
 * lives behind expanding the column, which is the safer place for it
 */
function AccountRow({
  account,
  railed,
}: {
  account: string | null;
  railed: boolean;
}) {
  if (!account) {
    if (railed) {
      return (
        <Link
          href="/signin"
          title="Sign in"
          className="flex size-10 items-center justify-center rounded-full bg-card ring-1 ring-primary/[0.08] transition-colors hover:ring-primary/20"
        >
          <WhatsAppIcon className="size-4 text-secondary" />
          <span className="sr-only">Sign in</span>
        </Link>
      );
    }

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

  if (railed) {
    return (
      <span
        title={`${account}, signed in`}
        className="flex size-10 items-center justify-center rounded-full bg-brand/15"
      >
        <CheckIcon className="size-4 text-brand" />
        <span className="sr-only">{account}, signed in</span>
      </span>
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
