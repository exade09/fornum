import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { MobileNav, SideNav } from "@/components/shell/side-nav";
import { SiteFooter } from "@/components/shell/footer";
import { readSession } from "@/lib/auth/session";
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
    default: "Fornum",
    template: "%s — Fornum",
  },
  description:
    "Fornum deploys your token on Solana from one WhatsApp message. Its creator fees are split on chain and you claim your share with the number you launched from",
  openGraph: {
    siteName: "Fornum",
    title: "Fornum",
    type: "website",
    locale: "en_US",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Fornum" }],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await readSession();

  // the column width the visitor last chose, read on the server so the layout
  // renders at its final width instead of snapping after hydration
  const railed = (await cookies()).get("fornum_nav")?.value === "rail";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm"
        >
          Skip to content
        </a>

        <SideNav account={session?.masked ?? null} defaultRailed={railed} />

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav account={session?.masked ?? null} />
          <main id="main" className="relative flex-1">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
