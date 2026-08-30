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
    >
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col md:flex-row">
          <Navigacija />
          <main className="min-w-0 flex-1 p-4 md:p-8">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
