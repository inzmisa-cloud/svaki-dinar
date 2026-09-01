import { obrisiKredit, platiRatu } from "@/app/actions";
import { NaslovStranice, Prazno, Sekcija, StatKartica } from "@/components/ui";
import { danas, formatDatum, formatRSD } from "@/lib/format";
import { aktivniRacuni, listaKredita } from "@/lib/queries";
import { FormaKredita } from "./forma";

export const dynamic = "force-dynamic";

export default async function KreditiPage() {
  const [krediti, racuni] = await Promise.all([listaKredita(), aktivniRacuni()]);

  const aktivni = krediti.filter((k) => k.aktivan);
  const mesecniTerecenje = aktivni.reduce((s, k) => s + k.rataPara, 0);
  const ukupanDug = krediti.reduce((s, k) => s + k.preostaliDugPara, 0);

  return (
    <>
      <NaslovStranice
        naslov="Krediti"
        opis="Raspored rata, preostali dug i plaćanje na jednom mestu."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="grid grid-cols-2 gap-4">
            <StatKartica
              naslov="Mesečni teret"
              vrednost={formatRSD(mesecniTerecenje)}
              podnaslov={`${aktivni.length} aktivnih kredit(a)`}
            />
            <StatKartica naslov="Preostali dug" vrednost={formatRSD(ukupanDug)} />
          </div>

            <Sekcija naslov={`Moji krediti (${krediti.length})`}>
            {krediti.length === 0 ? (
              <Prazno tekst="Još nema unetih kredita." />
            ) : (
              <ul className="space-y-4">
                {krediti.map((k, i) => {
                  const procenat =
                    k.ukupnoRata > 0 && k.ukupnoRata >= k.placenoRata
                      ? Math.round((k.placenoRata / k.ukupnoRata) * 100)
                      : 0;
                  const zavrsen = !k.aktivan || k.preostaloRata === 0;
                  return (
                    <li
                      key={k.id}
                      className="kartica kartica-hover animate-fade-up flex flex-col gap-4 p-5 sm:flex-row sm:items-start"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                              zavrsen
                                ? "bg-emerald-100/70 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                                : "bg-brand-100/70 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                            }`}
                          >
                            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="5" width="20" height="14" rx="2" />
                              <path d="M2 10h20" />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{k.naziv}</p>
                            {zavrsen ? (
                              <span className="inline-block rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                                otplaćen
                              </span>
                            ) : (
                              <p className="text-xs text-slate-400 dark:text-slate-500">
                                Rata {k.rataPara > 0 ? formatRSD(k.rataPara) : "—"} · {k.preostaloRata} rata preostalo
                              </p>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          Počeo {formatDatum(k.datumPocetka)} · naplata do {k.danNaplate}. u mesecu
                          {k.kamatnaStopa > 0 ? ` · stopa ${k.kamatnaStopa}%` : ""}
                        </p>

                        {k.preostaliDugPara > 0 && (
                          <div className="mt-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 dark:text-slate-500">Preostali dug</span>
                              <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                                {formatRSD(k.preostaliDugPara)}
                              </span>
                            </div>
                            <div className="progress mt-1.5">
                              <div
                                className="progress-bar hero-gradient-dark"
                                style={{ width: `${Math.min(100, 100 - procenat)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                        <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
                          {procenat}%
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                          otplaćeno
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Sekcija>

          <div className="mt-6">
            <Sekcija naslov="Akcije">
              <p className="text-sm text-slate-500 dark:text-slate-400">Brza naplata rate — izaberi kredit u planeru:</p>
              <select className="input mt-3">
                <option value="">Izaberi kredit…</option>
                {krediti.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.naziv}
                  </option>
                ))}
              </select>
            </Sekcija>
          </div>
        </div>

        <div>
          <Sekcija naslov="Novi kredit / refinansiranje">
            <FormaKredita
              racuni={racuni.map((r) => ({ id: r.id, naziv: r.naziv }))}
              danasDatum={danas()}
            />
          </Sekcija>
        </div>
      </div>
    </>
  );
}