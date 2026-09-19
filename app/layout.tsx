import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TopNav } from "@/components/shell/top-nav";
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
    default: "Fornum, launch a token and get its fees by phone",
    template: "%s — Fornum",
  },
  description:
    "Fornum deploys your token on Solana and routes its creator fees to one confirmed WhatsApp number. We claim, call and pay out in dollars",
  openGraph: {
    siteName: "Fornum",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>

        <TopNav />

        <main id="main" className="relative flex-1">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
