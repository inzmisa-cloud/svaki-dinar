import { kopirajBudzeteIzPrethodnogMeseca, obrisiBudzet } from "@/app/actions";
import { NaslovStranice, Prazno, Sekcija } from "@/components/ui";
import { formatMesec, formatRSD, prethodniMesec, tekuciMesec } from "@/lib/format";
import { budzetiSaPotrosnjom, sveKategorije } from "@/lib/queries";
import { FormaBudzeta } from "./forma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mesec?: string }>;

function bojaProgresa(potrosnja: number, limit: number): string {
  const p = potrosnja / limit;
  if (p >= 1) return "var(--danger)";
  if (p >= 0.8) return "var(--warning)";
  return "var(--success)";
}

export default async function BudzetiPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const mesec = /^\d{4}-\d{2}$/.test(sp.mesec ?? "") ? sp.mesec! : tekuciMesec();

  const [budzeti, kategorije] = await Promise.all([
    budzetiSaPotrosnjom(mesec),
    sveKategorije(),
  ]);
  const rashodKategorije = kategorije.filter((k) => k.tip === "rashod");

  const ukupnoLimit = budzeti.reduce((s, b) => s + b.limitPara, 0);
  const ukupnoPotrosnja = budzeti.reduce((s, b) => s + b.potrosnjaPara, 0);

  return (
    <>
      <NaslovStranice
        naslov="Budžeti"
        opis={`Mesečni limiti po kategorijama — ${formatMesec(mesec)}.`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <Sekcija naslov="Izbor meseca">
            <div className="flex flex-wrap items-end gap-3">
              <form method="get" className="flex items-end gap-2">
                <div>
                  <label className="label" htmlFor="m-mesec">
                    Mesec
                  </label>
                  <input
                    id="m-mesec"
                    name="mesec"
                    type="month"
                    className="input"
                    defaultValue={mesec}
                  />
                </div>
                <button type="submit" className="btn-primary">Prikaži</button>
              </form>
              <form action={kopirajBudzeteIzPrethodnogMeseca}>
                <button type="submit" className="btn-ghost">
                  Kopiraj iz {formatMesec(prethodniMesec(mesec))}
                </button>
              </form>
            </div>
          </Sekcija>

          <Sekcija naslov="Novi / izmena budžeta">
            <FormaBudzeta
              mesec={mesec}
              kategorije={rashodKategorije.map((k) => ({ id: k.id, naziv: k.naziv }))}
            />
            <p className="mt-2 text-xs text-slate-500">
              Ako budžet za kategoriju već postoji, unosi se novi limit.
            </p>
          </Sekcija>

          <Sekcija naslov="Pregled potrošnje">
            {ukupnoLimit > 0 ? (
              <span className="text-xs text-slate-500 tabular-nums">
                {formatRSD(ukupnoPotrosnja)} / {formatRSD(ukupnoLimit)}
              </span>
            ) : undefined}
          </Sekcija>

          {budzeti.length === 0 ? (
            <Prazno tekst="Nema budžeta za ovaj mesec. Postavi prvi — kontrola počinje od limita." />
          ) : (
            <Sekcija naslov="Kategorije">
              <ul className="space-y-4">
                {budzeti.map((b) => {
                  const procenat =
                    b.limitPara > 0 ? Math.min(999, Math.round((b.potrosnjaPara / b.limitPara) * 100)) : 0;
                  const prekoracen = b.potrosnjaPara > b.limitPara;
                  return (
                    <li key={b.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg hover:shadow-slate-200/20 transition-shadow">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: b.boja }} />
                        {b.naziv}
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-sm tabular-nums ${
                            prekoracen ? "font-semibold text-red-600" : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {formatRSD(b.potrosnjaPara)} / {formatRSD(b.limitPara)}
                          <span className="ml-1.5 text-xs text-slate-400">({procenat}%)</span>
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-600">
                        <div
                          className={`h-full rounded-full transition-all ${bojaProgresa(
                            b.potrosnjaPara,
                            b.limitPara,
                          )}`}
                          style={{ width: `${Math.min(100, procenat)}%` }}
                        />
                      </div>
                      <form action={obrisiBudzet}>
                        <input type="hidden" name="id" value={b.id} />
                        <button type="submit" className="btn-danger self-center">
                          Obriši
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </Sekcija>
          )}
        </div>

        <div className="lg:col-span-1">
          <Sekcija naslov="Ukupno">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium text-slate-500">Ukupni limit</span>
              <p className="text-2xl font-bold tabular-nums">{formatRSD(ukupnoLimit)}</p>
              <span className="text-xs text-slate-500">Ukupno potrošeno</span>
              <p className="text-2xl font-bold tabular-nums">{formatRSD(ukupnoPotrosnja)}</p>
            </div>
          </Sekcija>
        </div>
      </div>
    </>
  );
}