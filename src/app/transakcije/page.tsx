import { obrisiTransakciju } from "@/app/actions";
import { NaslovStranice, Prazno, Sekcija } from "@/components/ui";
import { danas, formatDatum, formatMesec, formatRSD, tekuciMesec } from "@/lib/format";
import { aktivniRacuni, listaTransakcija, sveKategorije } from "@/lib/queries";
import { FormaTransakcije } from "./forma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mesec?: string; tip?: string; kat?: string }>;

export default async function TransakcijePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const mesec = /^\d{4}-\d{2}$/.test(sp.mesec ?? "") ? sp.mesec! : tekuciMesec();
  const tip = sp.tip === "prihod" || sp.tip === "rashod" ? sp.tip : undefined;
  const kat = Number(sp.kat) > 0 ? Number(sp.kat) : undefined;

  const [racuni, kategorije, redovi] = await Promise.all([
    aktivniRacuni(),
    sveKategorije(),
    listaTransakcija({ mesec, tip, kategorijaId: kat }),
  ]);

  return (
    <>
      <NaslovStranice
        naslov="Transakcije"
        opis={`${formatMesec(mesec)} — ${redovi.length} zapisa.`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <Sekcija naslov="Nova transakcija">
            <FormaTransakcije
              racuni={racuni.map((r) => ({ id: r.id, naziv: r.naziv }))}
              kategorije={kategorije.map((k) => ({ id: k.id, naziv: k.naziv, tip: k.tip }))}
              podrazumevaniDatum={danas()}
            />
          </Sekcija>

          <Sekcija naslov="Filteri">
            <form method="get" className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="label" htmlFor="f-mesec">
                  Mesec
                </label>
                <input id="f-mesec" name="mesec" type="month" className="input" defaultValue={mesec} />
              </div>
              <div>
                <label className="label" htmlFor="f-tip">
                  Tip
                </label>
                <select id="f-tip" name="tip" className="input" defaultValue={tip ?? ""}>
                  <option value="">Svi</option>
                  <option value="prihod">Prihodi</option>
                  <option value="rashod">Rashodi</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="f-kat">
                  Kategorija
                </label>
                <select id="f-kat" name="kat" className="input" defaultValue={kat ? String(kat) : ""}>
                  <option value="">Sve</option>
                  {kategorije.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.naziv}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="btn-primary">Primeni</button>
                <a href="/transakcije" className="btn-ghost">Očisti</a>
              </div>
            </form>
          </Sekcija>

          <Sekcija naslov={`Spisak (${redovi.length})`}>
            {redovi.length === 0 ? (
              <Prazno tekst="Nema transakcija za izabrane filtere." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-slate-700/50 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <th className="py-3 pr-4 font-medium">Datum</th>
                      <th className="py-3 pr-4 font-medium">Opis</th>
                      <th className="py-3 pr-4 font-medium">Kategorija</th>
                      <th className="py-3 pr-4 font-medium">Račun</th>
                      <th className="py-3 text-right font-medium">Iznos</th>
                      <th className="py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:bg-slate-900/50">
                    {redovi.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="whitespace-nowrap py-3 pr-4 tabular-nums text-slate-600 dark:text-slate-400">
                          {formatDatum(t.datum)}
                        </td>
                        <td className="max-w-[18rem] truncate py-3 pr-4 font-medium">
                          {t.opis || "—"}
                          {t.kreditId ? (
                            <span className="ml-1.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">
                              rata
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4">
                          {t.kategorijaNaziv ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: t.kategorijaBoja ?? "#94a3b8" }}
                              />
                              {t.kategorijaNaziv}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">{t.racunNaziv}</td>
                        <td
                          className={`whitespace-nowrap py-3 pr-4 text-right font-semibold tabular-nums ${
                            t.tip === "prihod" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {t.tip === "prihod" ? "+" : "−"}
                          {formatRSD(t.iznosPara)}
                        </td>
                        <td className="py-3 text-right">
                          <form action={obrisiTransakciju}>
                            <input type="hidden" name="id" value={t.id} />
                            <button type="submit" className="btn-danger">
                              Obriši
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Sekcija>
        </div>

        <div className="lg:col-span-1">
          <Sekcija naslov="Statistika">
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Ukupni prihodi</p>
              <p className="text-2xl font-bold tabular-nums text-green-600">{formatRSD(redovi.filter((t) => t.tip === "prihod").reduce((s, t) => s + t.iznosPara, 0))}</p>
              <p className="text-xs font-medium text-slate-500">Ukupni rashodi</p>
              <p className="text-2xl font-bold tabular-nums text-red-600">{formatRSD(redovi.filter((t) => t.tip === "rashod").reduce((s, t) => s + t.iznosPara, 0))}</p>
            </div>
          </Sekcija>
        </div>
      </div>
    </>
  );
}