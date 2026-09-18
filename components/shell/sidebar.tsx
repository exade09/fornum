"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, FornumMark, WhatsAppIcon } from "@/components/icons";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "fornum:sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // per viewer preference, kept out of the server rendered markup
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* private mode, just stay expanded */
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* nothing to do */
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 z-60 hidden h-svh shrink-0 bg-background transition-[width] duration-200 nav:block",
        collapsed ? "w-20" : "w-20 xl:w-[275px]",
      )}
    >
      <div className="absolute inset-y-0 left-0 flex h-full w-full flex-col justify-between overflow-x-hidden overflow-y-auto border-r px-3 pt-0 pb-3">
        <div>
          <Link
            href="/"
            className="flex h-16 w-fit items-center rounded-full px-[3px] text-primary transition-colors hover:bg-background-hover/40"
            aria-label="Fornum home"
          >
            <span className="flex size-11 items-center justify-center">
              <FornumMark className="size-7" />
            </span>
          </Link>

          <nav className="flex flex-col gap-0.5">
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
                  aria-current={active ? "page" : undefined}
                  className="group flex w-fit cursor-pointer items-center gap-5 rounded-full px-[3px] py-3 transition-colors hover:bg-background-hover/40"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center">
                    <Icon
                      className={cn(
                        "size-[26px] transition-colors",
                        active
                          ? "text-primary"
                          : "text-primary/70 group-hover:text-primary",
                      )}
                    />
                  </span>
                  <span
                    className={cn(
                      "hidden pr-5 text-xl leading-[26px] transition-colors",
                      collapsed ? "xl:hidden" : "xl:inline",
                      active
                        ? "font-bold text-primary"
                        : "font-normal text-primary/70 group-hover:text-primary",
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <Link
          href="/docs"
          className="mb-2 flex items-center gap-3 rounded-full p-2 transition-colors hover:bg-card xl:p-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card ring-1 ring-border">
            <WhatsAppIcon className="size-5 text-brand" />
          </span>
          <span
            className={cn(
              "hidden min-w-0 flex-1 text-left",
              collapsed ? "xl:hidden" : "xl:flex xl:flex-col",
            )}
          >
            <span className="truncate text-sm font-bold">Fornum</span>
            <span className="truncate text-sm text-secondary">
              fees to WhatsApp
            </span>
          </span>
        </Link>
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand menu" : "Collapse menu"}
        aria-expanded={!collapsed}
        className={cn(
          "absolute top-4 z-10 hidden size-8 -translate-x-1/2 items-center justify-center rounded-full border bg-background text-primary/60 transition-[left,background-color,color] duration-200 hover:bg-card hover:text-primary xl:flex",
          collapsed ? "left-20" : "left-[275px]",
        )}
      >
        <ChevronLeftIcon
          className={cn(
            "size-4 transition-transform duration-200",
            collapsed && "rotate-180",
          )}
        />
      </button>
    </aside>
  );
}
