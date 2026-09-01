import Link from "next/link";
import {
  budzetiSaPotrosnjom,
  listaKredita,
  listaStalnih,
  listaTransakcija,
  mesecTotals,
  primenjeneStalne,
  racuniSaStanjem,
} from "@/lib/queries";
import {
  formatDatum,
  formatMesec,
  formatRSD,
  tekuciMesec,
} from "@/lib/format";
import { izracunajUpozorenja } from "@/lib/alerts";
import {
  NaslovStranice,
  Sekcija,
  StatKartica,
  Prazno,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const NIVO_STIL = {
  opasnost: {
    kartica: "border-rose-200/70 bg-rose-50/60 dark:border-rose-500/30 dark:bg-rose-500/10",
    dot: "bg-rose-500",
    tekst: "text-rose-700 dark:text-rose-300",
    label: "Opasnost",
  },
  upozorenje: {
    kartica: "border-amber-200/70 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10",
    dot: "bg-amber-500",
    tekst: "text-amber-700 dark:text-amber-300",
    label: "Upozorenje",
  },
  info: {
    kartica: "border-sky-200/70 bg-sky-50/60 dark:border-sky-500/30 dark:bg-sky-500/10",
    dot: "bg-sky-500",
    tekst: "text-sky-700 dark:text-sky-300",
    label: "Info",
  },
} as const;

export default async function Pregled() {
  const mesec = tekuciMesec();
  const [racuni, totals, budzeti, krediti, poslednje, stalni, uneteStalne] = await Promise.all([
    racuniSaStanjem(),
    mesecTotals(mesec),
    budzetiSaPotrosnjom(mesec),
    listaKredita(true),
    listaTransakcija({ limit: 6 }),
    listaStalnih(),
    primenjeneStalne(mesec),
  ]);

  const ukupnoStanje = racuni.reduce((s, r) => s + r.stanjePara, 0);
  const aktivniStalni = stalni.filter((s) => s.aktivan);
  const neprimenjeneStalne = aktivniStalni.filter((s) => !uneteStalne.has(s.id)).length;
  const upozorenja = izracunajUpozorenja({
    ukupnoStanjePara: ukupnoStanje,
    mesecTotals: totals,
    budzeti,
    krediti,
    neprimenjenihStalnih: neprimenjeneStalne,
  });

  const neto = totals.prihod - totals.rashod;
  const rateNaVidiku = krediti.filter(
    (k) => k.sledecaRataDatum && k.preostaloRata > 0,
  );

  return (
    <>
      <NaslovStranice
        naslov="Pregled"
        opis={`${formatMesec(mesec)} — svaki dinar pod kontrolom.`}
      />

      {/* Hero balance card */}
      <div className="hero-gradient dark:hero-gradient-dark relative mb-6 overflow-hidden rounded-3xl p-6 text-white shadow-2xl shadow-brand-500/20 sm:p-8 animate-fade-up">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 right-20 size-48 rounded-full bg-fuchsia-300/20 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
            Ukupno stanje
          </p>
          <p
            className={`mt-2 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl ${
              ukupnoStanje < 0 ? "text-rose-100" : "text-white"
            }`}
          >
            {formatRSD(ukupnoStanje)}
          </p>
          <div className="mt-5 flex flex-wrap gap-6">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">Prihod (mesec)</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums">+{formatRSD(totals.prihod)}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">Rashod (mesec)</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums">−{formatRSD(totals.rashod)}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">Neto (mesec)</p>
              <p className={`mt-0.5 text-base font-semibold tabular-nums ${neto < 0 ? "text-rose-100" : "text-emerald-100"}`}>
                {neto < 0 ? "−" : "+"}
                {formatRSD(Math.abs(neto))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatKartica naslov="Ukupno stanje" vrednost={formatRSD(ukupnoStanje)} ton={ukupnoStanje < 0 ? "negativno" : "neutral"} />
        <StatKartica naslov="Prihod (mesec)" vrednost={formatRSD(totals.prihod)} ton="pozitivno" />
        <StatKartica naslov="Rashod (mesec)" vrednost={formatRSD(totals.rashod)} ton="negativno" />
        <StatKartica naslov="Neto (mesec)" vrednost={formatRSD(neto)} ton={neto < 0 ? "negativno" : "pozitivno"} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {upozorenja.length > 0 && (
            <Sekcija naslov={`Upozorenja (${upozorenja.length})`}>
              <ul className="space-y-3">
                {upozorenja.map((u, i) => {
                  const st = NIVO_STIL[u.nivo];
                  return (
                    <li
                      key={i}
                      className={`flex items-start gap-3 rounded-2xl border p-4 animate-fade-up ${st.kartica}`}
                    >
                      <span className={`mt-0.5 size-2.5 shrink-0 rounded-full ${st.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] font-bold uppercase tracking-wide ${st.tekst}`}>
                          {st.label}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">{u.naslov}</p>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{u.tekst}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Sekcija>
          )}

          {!rateNaVidiku.length ? (
            <Prazno tekst="Nema aktivnih rata — odlično!" />
          ) : (
            <Sekcija naslov="Rate na vidiku">
              <ul className="divide-y divide-slate-100/80 dark:divide-slate-800/70">
                {rateNaVidiku.map((k) => (
                  <li key={k.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">{k.naziv}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {formatDatum(k.sledecaRataDatum!)} · ostalo {k.preostaloRata} rata
                      </p>
                    </div>
                    <span className="whitespace-nowrap rounded-lg bg-rose-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                      −{formatRSD(k.rataPara)}
                    </span>
                  </li>
                ))}
              </ul>
            </Sekcija>
          )}

          <Sekcija naslov="Računi">
            {racuni.length === 0 ? (
              <Prazno tekst="Dodaj prvi račun kroz formu za transakcije." />
            ) : (
              <ul className="divide-y divide-slate-100/80 dark:divide-slate-800/70">
                {racuni.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100/80 text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
                        <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="6" width="18" height="12" rx="2" />
                          <path d="M3 10h18" />
                        </svg>
                      </span>
                      <p className="text-sm font-medium capitalize">{r.naziv}</p>
                    </div>
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        r.stanjePara < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {formatRSD(r.stanjePara)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Sekcija>
        </div>

        <div className="space-y-6">
          <Sekcija
            naslov="Ponavljajuće stavke (mesečno)"
            akcija={
              <Link
                href="/ponavljajuce"
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
              >
                Upravljaj →
              </Link>
            }
          >
            {aktivniStalni.length === 0 ? (
              <Prazno tekst="Nema ponavljajućih stavki." />
            ) : (
              <ul className="divide-y divide-slate-100/80 dark:divide-slate-800/70">
                {aktivniStalni.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">{s.naziv}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {s.danUMesecu}. u mesecu
                        {uneteStalne.has(s.id) ? (
                          <span className="ml-1.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                            uneto
                          </span>
                        ) : (
                          <span className="ml-1.5 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                            čeka unos
                          </span>
                        )}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        s.tip === "prihod"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {s.tip === "prihod" ? "+" : "−"}
                      {formatRSD(s.iznosPara)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Sekcija>

          <Sekcija
            naslov="Skorašnje transakcije"
            akcija={
              <Link
                href="/transakcije"
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-brand-400 dark:hover:bg-brand-500/10 dark:hover:text-brand-300"
              >
                Sve transakcije →
              </Link>
            }
          >
            {poslednje.length === 0 ? (
              <Prazno tekst="Još nema transakcija. Zabeleži prvu — svaki dinar se računa." />
            ) : (
              <ul className="divide-y divide-slate-100/80 dark:divide-slate-800/70">
                {poslednje.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <span
                          className={`flex size-2 shrink-0 rounded-full ${
                            t.tip === "prihod" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        <span className="truncate">{t.opis || t.kategorijaNaziv || "Bez opisa"}</span>
                      </p>
                      <p className="mt-0.5 pl-4 text-xs text-slate-400 dark:text-slate-500">
                        {formatDatum(t.datum)}
                        {t.racunNaziv ? ` · ${t.racunNaziv}` : ""}
                        {t.kategorijaNaziv ? ` · ${t.kategorijaNaziv}` : ""}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        t.tip === "prihod"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {t.tip === "prihod" ? "+" : "−"}
                      {formatRSD(t.iznosPara)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Sekcija>
        </div>
      </div>
    </>
  );
}
