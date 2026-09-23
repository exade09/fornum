import Link from "next/link";
import { Brand } from "@/components/shell/brand";
import { FOOTER_LINKS } from "@/lib/nav";

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full px-4 pt-10 pb-10 lg:px-6 xl:max-w-7xl">
      {/* one row, everything that is not a section of the app */}
      <div className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2 text-primary">
          <Brand size={24} />
          <span className="text-sm font-bold">Fornum</span>
          <span className="ml-1 text-sm text-secondary">© 2026</span>
        </span>

        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-secondary transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <p className="mt-4 max-w-[60ch] text-xs text-secondary">
        We only reply in threads you start. Not affiliated with WhatsApp or
        Meta
      </p>
    </footer>
  );
}
