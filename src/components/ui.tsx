import type { ReactNode } from "react";

export function NaslovStranice({
  naslov,
  opis,
  akcija,
}: {
  naslov: string;
  opis?: string;
  akcija?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-500 dark:text-brand-400">
          Svaki dinar
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{naslov}</h1>
        {opis ? (
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{opis}</p>
        ) : null}
      </div>
      {akcija ? <div className="shrink-0">{akcija}</div> : null}
    </div>
  );
}

const TONOVI = {
  neutral: {
    vrednost: "text-slate-900 dark:text-slate-50",
    ikona: "text-slate-400 dark:text-slate-500",
    bg: "bg-slate-100/70 dark:bg-slate-800/60",
  },
  pozitivno: {
    vrednost: "text-emerald-600 dark:text-emerald-400",
    ikona: "text-emerald-500",
    bg: "bg-emerald-100/70 dark:bg-emerald-500/15",
  },
  negativno: {
    vrednost: "text-rose-600 dark:text-rose-400",
    ikona: "text-rose-500",
    bg: "bg-rose-100/70 dark:bg-rose-500/15",
  },
} as const;

export function StatKartica({
  naslov,
  vrednost,
  podnaslov,
  ton = "neutral",
}: {
  naslov: string;
  vrednost: string;
  podnaslov?: string;
  ton?: keyof typeof TONOVI;
}) {
  const t = TONOVI[ton];
  return (
    <div className="kartica kartica-hover group animate-fade-up flex flex-col items-start gap-2 p-5">
      <div className="flex w-full items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {naslov}
        </p>
        <span className={`flex size-8 items-center justify-center rounded-lg ${t.bg} ${t.ikona}`}>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {ton === "pozitivno" ? <path d="M12 19V5M5 12l7-7 7 7" /> : null}
            {ton === "negativno" ? <path d="M12 5v14M5 12l7 7 7-7" /> : null}
            {ton === "neutral" ? <path d="M3 12h18M12 3v18" /> : null}
          </svg>
        </span>
      </div>
      <p className={`text-2xl font-bold tabular-nums tracking-tight ${t.vrednost}`}>{vrednost}</p>
      {podnaslov ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">{podnaslov}</p>
      ) : null}
    </div>
  );
}

export function Sekcija({
  naslov,
  children,
  akcija,
}: {
  naslov: string;
  children: ReactNode;
  akcija?: ReactNode;
}) {
  return (
    <section className="kartica animate-fade-up overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100/80 px-5 py-3.5 dark:border-slate-800/70">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {naslov}
        </h2>
        {akcija}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Prazno({ tekst }: { tekst: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100/70 dark:bg-slate-800/60">
        <svg className="h-6 w-6 text-slate-300 dark:text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <p className="max-w-xs text-sm text-slate-400 dark:text-slate-500">{tekst}</p>
    </div>
  );
}
