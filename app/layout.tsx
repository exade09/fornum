import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/shell/sidebar";
import { SiteHeader } from "@/components/shell/header";
import { SiteFooter } from "@/components/shell/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Fornum — звонки и выплаты по токенам на Solana",
    template: "%s — Fornum",
  },
  description:
    "Заявка на звонок и перевод комиссий на подтверждённый номер WhatsApp. Всё ончейн: очередь, статус заявки и подтверждение выплаты.",
  openGraph: {
    siteName: "Fornum",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm"
        >
          К содержимому
        </a>

        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
