import { NaslovStranice, Prazno, Sekcija, StatKartica } from "@/components/ui";
import { formatMesec, formatRSD, poslednjihNMeseci, tekuciMesec } from "@/lib/format";
import { mesecTotals, potrosnjaPoKategoriji, totalsPoMesecima } from "@/lib/queries";
import { GrafikonKategorija, GrafikonMeseci } from "./grafikoni";

export const dynamic = "force-dynamic";

export default async function IzvestajiPage() {
  const mesec = tekuciMesec();
  const meseci = poslednjihNMeseci(6);

  const [poMesecima, poKategoriji, tekuci] = await Promise.all([
    totalsPoMesecima(meseci),
    potrosnjaPoKategoriji(mesec),
    mesecTotals(mesec),
  ]);

  return (
    <>
      <NaslovStranice
        naslov="Izveštaji"
        opis={`Trendovi zadnjih 6 meseci i struktura rashoda za ${formatMesec(mesec)}.`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatKartica naslov="Prihod (mesec)" vrednost={formatRSD(tekuci.prihod)} ton="pozitivno" />
        <StatKartica naslov="Rashod (mesec)" vrednost={formatRSD(tekuci.rashod)} ton="negativno" />
        <StatKartica
          naslov="Stopa štednje"
          vrednost={
            tekuci.prihod > 0
              ? `${Math.round(((tekuci.prihod - tekuci.rashod) / tekuci.prihod) * 100)}%`
              : "—"
          }
          ton={tekuci.prihod - tekuci.rashod >= 0 ? "pozitivno" : "negativno"}
        />
      </div>

      <div className="mt-6 space-y-6">
        <Sekcija naslov="Prihodi vs rashodi (6 meseci)">
          <GrafikonMeseci podaci={poMesecima} />
        </Sekcija>

        <div className="grid gap-6 lg:grid-cols-2">
          <Sekcija naslov="Struktura rashoda">
            <GrafikonKategorija podaci={poKategoriji} />
          </Sekcija>

          <Sekcija naslov="Mesečni pregled">
            {poMesecima.length === 0 ? (
              <Prazno tekst="Nema podataka." />
            ) : (
              <div className="-mx-5 -mb-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
                      <th className="bg-slate-50/60 px-5 py-3 font-semibold dark:bg-slate-800/40">Mesec</th>
                      <th className="bg-slate-50/60 px-4 py-3 text-right font-semibold dark:bg-slate-800/40">Prihod</th>
                      <th className="bg-slate-50/60 px-4 py-3 text-right font-semibold dark:bg-slate-800/40">Rashod</th>
                      <th className="bg-slate-50/60 px-5 py-3 text-right font-semibold dark:bg-slate-800/40">Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80 dark:divide-slate-800/70">
                    {poMesecima.map((m) => {
                      const neto = m.prihod - m.rashod;
                      return (
                        <tr key={m.mesec} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                          <td className="px-5 py-3 font-medium">{formatMesec(m.mesec)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                            +{formatRSD(m.prihod)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-rose-600 dark:text-rose-400">
                            −{formatRSD(m.rashod)}
                          </td>
                          <td
                            className={`px-5 py-3 text-right font-semibold tabular-nums ${
                              neto < 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {neto < 0 ? "−" : "+"}
                            {formatRSD(Math.abs(neto))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
              Cilj: stopa štednje iznad 20% svakog meseca dok traje otplata kredita.
            </p>
          </Sekcija>
        </div>
      </div>
    </>
  );
}
