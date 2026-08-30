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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{naslov}</h1>
        {opis ? (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {opis}
          </p>
        ) : null}
      </div>
      {akcija}
    </div>
  );
}

const TONOVI = {
  neutral: "text-slate-900",
  pozitivno: "text-green-600",
  negativno: "text-red-600",
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
  return (
    <div
      className={
        "kartica rounded-2xl p-6 flex flex-col items-start gap-3 hover:shadow-lg hover:shadow-slate-200/30 transition-shadow backdrop-blur-sm"
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {naslov}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums {TONOVI[ton]} dark:text-slate-100">
        {vrednost}
      </p>
      {podnaslov ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{podnaslov}</p>
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
    <section
      className={
        "kartica rounded-2xl p-6 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
      }
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {naslov}
        </h2>
        {akcija}
      </div>
      {children}
    </section>
  );
}

export function Prazno({ tekst }: { tekst: string }) {
  return (
    <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
      {tekst}
    </p>
  );
}