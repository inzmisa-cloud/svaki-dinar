"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STAVKE = [
  { href: "/", label: "Pregled" },
  { href: "/transakcije", label: "Transakcije" },
  { href: "/kalendar", label: "Kalendar" },
  { href: "/ponavljajuce", label: "Ponavljajuće" },
  { href: "/budzeti", label: "Budžeti" },
  { href: "/krediti", label: "Krediti" },
  { href: "/izvestaji", label: "Izveštaji" },
] as const;

export function Navigacija() {
  const pathname = usePathname();
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    setIsDark(
      JSON.parse(localStorage.getItem("svaki-dinar-dark") || "false"),
    );
  }, []);

  React.useEffect(() => {
    const matched = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark !== matched) {
      const novi = window.matchMedia("(prefers-color-scheme: dark)").matches;
      localStorage.setItem("svaki-dinar-dark", novi ? "true" : "false");
      document.documentElement.classList.toggle("dark", novi);
      document.documentElement.setAttribute("data-theme", novi ? "dark" : "light");
    }
  }, [isDark]);

  const jeAktivna = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div className="mb-6 px-3 pt-2">
          <p className="text-lg font-bold tracking-tight">Svaki dinar</p>
          <p className="mt-0.5 text-xs text-slate-500">Stroga kontrola finansija</p>
        </div>
        <nav className="flex flex-col gap-1">
          {STAVKE.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                jeAktivna(s.href) ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </aside>

      <nav className="sticky top-0 z-10 flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden">
        {STAVKE.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
              jeAktivna(s.href) ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </nav>

      <div className="mt-4 flex items-center gap-2 md:hidden">
        <button
          onClick={() => {
            const newDark = !isDark;
            setIsDark(newDark);
            document.documentElement.classList.toggle("dark", newDark);
            document.documentElement.setAttribute("data-theme", newDark ? "dark" : "light");
            localStorage.setItem("svaki-dinar-dark", newDark ? "true" : "false");
          }}
          className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDark ? "☀️" : "🌙"}
        </button>
      </div>
    </>
  );
}