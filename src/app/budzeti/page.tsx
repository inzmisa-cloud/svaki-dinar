import { kopirajBudzeteIzPrethodnogMeseca, obrisiBudzet } from "@/app/actions";
import { NaslovStranice, Prazno, Sekcija } from "@/components/ui";
import { formatMesec, formatRSD, prethodniMesec, tekuciMesec } from "@/lib/format";
import { budzetiSaPotrosnjom, sveKategorije } from "@/lib/queries";
import { FormaBudzeta } from "./forma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mesec?: string }>;

function bojaProgresa(potrosnja: number, limit: number): string {
  const p = potrosnja / limit;
  if (p >= 1) return "bg-rose-500";
  if (p >= 0.8) return "bg-amber-500";
  return "bg-emerald-500";
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
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Ukupno potrošeno / limit</span>
                  <span className="font-semibold tabular-nums">
                    {formatRSD(ukupnoPotrosnja)} <span className="text-slate-400">/</span> {formatRSD(ukupnoLimit)}
                  </span>
                </div>
                <div className="progress">
                  <div
                    className={`progress-bar transition-all ${
                      ukupnoPotrosnja > ukupnoLimit
                        ? "bg-rose-500"
                        : ukupnoPotrosnja / ukupnoLimit >= 0.8
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, Math.round((ukupnoPotrosnja / ukupnoLimit) * 100))}%` }}
                  />
                </div>
                <p
                  className={`text-xs font-medium tabular-nums ${
                    ukupnoPotrosnja > ukupnoLimit
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {Math.min(100, Math.round((ukupnoPotrosnja / ukupnoLimit) * 100))}% iskorišćen
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">Još nema limita za ovaj mesec.</p>
            )}
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
                  if (b.limitPara === 0 || b.limitPara >= 9999999) {
                    return null;
                  }
                  return (
                    <li key={b.id} className="rounded-2xl border border-slate-100 p-4 transition-all hover:border-slate-200 hover:shadow-sm dark:border-slate-800 dark:hover:border-slate-700">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: b.boja }} />
                          <p className="truncate text-sm font-medium">{b.naziv}</p>
                        </div>
                        <form action={obrisiBudzet} className="shrink-0">
                          <input type="hidden" name="id" value={b.id} />
                          <button
                            type="submit"
                            className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                            aria-label="Obriši"
                            title="Obriši"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            </svg>
                          </button>
                        </form>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span
                          className={`tabular-nums font-medium ${
                            prekoracen ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {formatRSD(b.potrosnjaPara)} / {formatRSD(b.limitPara)}
                        </span>
                        <span
                          className={`font-semibold tabular-nums ${
                            prekoracen ? "text-rose-600 dark:text-rose-400" : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {procenat}%
                        </span>
                      </div>
                      <div className="progress mt-2">
                        <div
                          className={`progress-bar ${bojaProgresa(b.potrosnjaPara, b.limitPara)}`}
                          style={{ width: `${Math.min(100, procenat)}%` }}
                        />
                      </div>
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