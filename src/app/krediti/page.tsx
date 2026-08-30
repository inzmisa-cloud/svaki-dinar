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
                {krediti.map((k) => {
                  const procenat =
                    k.ukupnoRata > 0 ? Math.round((k.placenoRata / k.ukupnoRata) * 100) : 0;
                  const zavrsen = !k.aktivan || k.preostaloRata === 0;
                  return (
                    <li
                      key={k.id}
                      className="rounded-2xl p-5 flex flex-col sm:flex-row gap-3 border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:shadow-slate-200/20 transition-shadow"
                    >
                      <header className="w-full sm:w-64">
                        <p className="text-sm font-semibold">{k.naziv}</p>
                        {zavrsen && (
                          <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-700">
                            otplaćen
                          </span>
                        )}
                      </header>

                      <section className="flex-1 min-w-0">
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Počeo {formatDatum(k.datumPocetka)} · naplata do {
                            k.danNaplate
                          }. u mesecu · stopa {k.kamatnaStopa}%
                        </p>
                      </section>
                    </li>
                  );
                })}
              </ul>
            )}
          </Sekcija>

          <div className="mt-6">
            <Sekcija naslov="Akcije">
              <p className="text-sm text-slate-500">Izaberite kredit za akciju:</p>
              <select className="input w-full select">
                <option value="">-- -- --</option>
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