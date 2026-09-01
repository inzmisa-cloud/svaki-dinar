"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STAVKE = [
  { href: "/", label: "Pregled", ikona: (akt: boolean) => IconPregled(akt) },
  { href: "/transakcije", label: "Transakcije", ikona: (akt: boolean) => IconTransakcije(akt) },
  { href: "/kalendar", label: "Kalendar", ikona: (akt: boolean) => IconKalendar(akt) },
  { href: "/ponavljajuce", label: "Ponavljajuće", ikona: (akt: boolean) => IconPonavljajuce(akt) },
  { href: "/budzeti", label: "Budžeti", ikona: (akt: boolean) => IconBudzeti(akt) },
  { href: "/krediti", label: "Krediti", ikona: (akt: boolean) => IconKrediti(akt) },
  { href: "/izvestaji", label: "Izveštaji", ikona: (akt: boolean) => IconIzvestaji(akt) },
] as const;

const IK = {
  stroke: (akt: boolean) => (akt ? "#ffffff" : "currentColor"),
  common: "h-5 w-5 shrink-0",
} as const;

function IconPregled(akt: boolean) {
  return (
    <svg className={IK.common} viewBox="0 0 24 24" fill="none" stroke={IK.stroke(akt)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}
function IconTransakcije(akt: boolean) {
  return (
    <svg className={IK.common} viewBox="0 0 24 24" fill="none" stroke={IK.stroke(akt)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h13" />
      <path d="m12 6 6 6-6 6" />
    </svg>
  );
}
function IconKalendar(akt: boolean) {
  return (
    <svg className={IK.common} viewBox="0 0 24 24" fill="none" stroke={IK.stroke(akt)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="3" />
      <path d="M8 2v4M16 2v4M3 9h18" />
    </svg>
  );
}
function IconPonavljajuce(akt: boolean) {
  return (
    <svg className={IK.common} viewBox="0 0 24 24" fill="none" stroke={IK.stroke(akt)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2v4M7 2v4" />
      <path d="M3 9h18" />
      <path d="M3 5h18v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  );
}
function IconBudzeti(akt: boolean) {
  return (
    <svg className={IK.common} viewBox="0 0 24 24" fill="none" stroke={IK.stroke(akt)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M15 9.5c-.6-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2.3 0 3 6 1.7 6 4.7 0 1.4-1.3 2.3-3 2.3-1.4 0-2.4-.5-3-1.5" />
    </svg>
  );
}
function IconKrediti(akt: boolean) {
  return (
    <svg className={IK.common} viewBox="0 0 24 24" fill="none" stroke={IK.stroke(akt)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h4M7 14h6" />
    </svg>
  );
}
function IconIzvestaji(akt: boolean) {
  return (
    <svg className={IK.common} viewBox="0 0 24 24" fill="none" stroke={IK.stroke(akt)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m7 15 4-5 3 3 5-7" />
    </svg>
  );
}

const LogoMarka = () => (
  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl hero-gradient shadow-lg shadow-brand-500/30">
    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M8 8h8M6 13h12M8 18h8" />
    </svg>
  </div>
);

function DarkToggle({
  isDark,
  onToggle,
  mobile,
}: {
  isDark: boolean;
  onToggle: () => void;
  mobile?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label="Promeni temu"
      className={`flex items-center justify-center rounded-xl border border-slate-200/60 bg-white/60 text-slate-500 transition-all hover:text-slate-900 hover:shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-white ${
        mobile ? "h-9 w-9" : "h-9 w-9"
      }`}
    >
      {isDark ? (
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}

// Module-level dark-mode store (avoids setState-in-effect for React Compiler)
const darkListeners = new Set<() => void>();

const darkSnapshot = (): boolean => {
  try {
    const saved = localStorage.getItem("svaki-dinar-dark");
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
};

function darkSubscriber(callback: () => void) {
  darkListeners.add(callback);
  return () => {
    darkListeners.delete(callback);
  };
}

export function Navigacija() {
  const pathname = usePathname();

  const isDark = React.useSyncExternalStore(
    darkSubscriber,
    darkSnapshot,
    () => false,
  );

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const promeniTemu = () => {
    const novi = !isDark;
    try {
      localStorage.setItem("svaki-dinar-dark", novi ? "true" : "false");
    } catch {}
    darkListeners.forEach((l) => l());
  };

  const jeAktivna = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white/70 px-4 py-6 backdrop-blur-xl dark:border-slate-800/70 dark:bg-[#0a101d]/70 md:flex">
        <div className="flex items-center gap-3 px-2 pb-6">
          <LogoMarka />
          <div className="leading-tight">
            <p className="text-[15px] font-bold tracking-tight">Svaki dinar</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">Stroga kontrola finansija</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-600">
            Meni
          </p>
          {STAVKE.map((s) => {
            const akt = jeAktivna(s.href);
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  akt
                    ? "hero-gradient text-white shadow-lg shadow-brand-500/25"
                    : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white"
                }`}
              >
                {s.ikona(akt)}
                <span className="truncate">{s.label}</span>
                {akt && (
                  <span className="ml-auto size-1.5 rounded-full bg-white/90 dark:bg-white/90" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 flex items-center justify-between border-t border-slate-200/70 px-2 pt-4 dark:border-slate-800/70">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {isDark ? "Tamna tema" : "Svetla tema"}
          </span>
          <DarkToggle isDark={isDark} onToggle={promeniTemu} />
        </div>
      </aside>

      {/* Mobile top nav */}
      <nav className="sticky top-0 z-20 flex items-center gap-2 overflow-x-auto border-b border-slate-200/70 bg-white/80 px-3 py-2 backdrop-blur-xl dark:border-slate-800/70 dark:bg-[#0a101d]/80 md:hidden">
        <div className="flex shrink-0 items-center gap-2 pr-1">
          <LogoMarka />
        </div>
        {STAVKE.map((s) => {
          const akt = jeAktivna(s.href);
          return (
            <Link
              key={s.href}
              href={s.href}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                akt
                  ? "hero-gradient text-white shadow-md shadow-brand-500/25"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60"
              }`}
            >
              {s.ikona(akt)}
              {s.label}
            </Link>
          );
        })}
        <div className="ml-auto flex shrink-0 items-center pl-2">
          <DarkToggle isDark={isDark} onToggle={promeniTemu} mobile />
        </div>
      </nav>
    </>
  );
}
