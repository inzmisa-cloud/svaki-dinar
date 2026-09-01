import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigacija } from "@/components/navigacija";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Svaki dinar",
  description: "Strogo vođenje ličnih financija — evidencija, budžeti, krediti i upozorenja.",
  keywords: ["finance", "personal finance", "budgeting"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="sr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <div className="relative flex min-h-screen flex-col md:flex-row">
          {/* Ambient background glow */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -top-40 left-1/4 h-[480px] w-[480px] rounded-full bg-brand-400/20 blur-[120px] dark:bg-brand-600/10" />
            <div className="absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full bg-fuchsia-400/10 blur-[120px] dark:bg-fuchsia-600/10" />
          </div>

          <Navigacija />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
            <div className="mx-auto max-w-5xl animate-fade-in">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
