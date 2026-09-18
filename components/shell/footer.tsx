import Link from "next/link";
import { FornumMark } from "@/components/icons";
import { FOOTER_LINKS } from "@/lib/nav";

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full px-4 pt-10 pb-12 lg:px-6 xl:max-w-7xl">
      <div className="grid gap-10 border-t pt-10 sm:grid-cols-[minmax(0,1fr)_repeat(3,auto)] sm:gap-16">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-primary">
            <FornumMark className="size-6" />
            <span className="text-lg font-bold">Fornum</span>
          </span>
          <span className="text-sm text-secondary">© 2026 Fornum</span>
          <span className="max-w-[28ch] text-sm text-secondary">
            Звонки только на подтверждённые номера. Не аффилировано с WhatsApp
            и Meta.
          </span>
        </div>

        {FOOTER_LINKS.map((group) => (
          <nav key={group.title} className="flex flex-col gap-3">
            <span className="text-sm font-bold text-primary">{group.title}</span>
            {group.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-secondary transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
    </footer>
  );
}
