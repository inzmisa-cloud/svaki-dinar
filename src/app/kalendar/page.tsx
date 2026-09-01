import Link from "next/link";
import { NaslovStranice, Prazno, Sekcija } from "@/components/ui";
import {
  formatDatum,
  formatMesec,
  formatRSD,
  danas,
  sledeciMesec,
  prethodniMesec,
  tekuciMesec,
} from "@/lib/format";
import {
  aktivniRacuni,
  listaKredita,
  listaStalnih,
  listaTransakcija,
  sveKategorije,
} from "@/lib/queries";
import { FormaTransakcije } from "@/app/transakcije/forma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ mesec?: string; dan?: string }>;

const DANI_U_NEDELJI = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];

export default async function KalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const mesec = /^\d{4}-\d{2}$/.test(sp.mesec ?? "") ? sp.mesec! : tekuciMesec();
  const izabraniDan = /^\d{4}-\d{2}-\d{2}$/.test(sp.dan ?? "") ? sp.dan! : null;
  const danasDatum = danas();

  const [transakcije, krediti, stalni, racuni, kategorije] = await Promise.all([
    listaTransakcija({ mesec, limit: 1000 }),
    listaKredita(true),
    listaStalnih(),
    aktivniRacuni(),
    sveKategorije(),
  ]);

  // Grupisanje transakcija po danu
  const poDanu = new Map<string, { prihod: number; rashod: number; broj: number }>();
  const detaljiDana = new Map<string, typeof transakcije>();
  for (const t of transakcije) {
    const stara = poDanu.get(t.datum) ?? { prihod: 0, rashod: 0, broj: 0 };
    if (t.tip === "prihod") stara.prihod += t.iznosPara;
    else stara.rashod += t.iznosPara;
    stara.broj += 1;
    poDanu.set(t.datum, stara);
    if (!detaljiDana.has(t.datum)) detaljiDana.set(t.datum, []);
    detaljiDana.get(t.datum)!.push(t);
  }

  // Planirane stavke (rate + ponavljajuće) po danu u mesecu
  type Plan = { naziv: string; iznosPara: number; tip: string };
  const planPoDanu = new Map<number, Plan[]>();
  const dodajPlan = (dan: number, plan: Plan) => {
    if (dan < 1 || dan > 31) return;
    if (!planPoDanu.has(dan)) planPoDanu.set(dan, []);
    planPoDanu.get(dan)!.push(plan);
  };
  for (const k of krediti) {
    if (k.aktivan && k.preostaloRata > 0) {
      dodajPlan(k.danNaplate, { naziv: `Rata: ${k.naziv}`, iznosPara: k.rataPara, tip: "rashod" });
    }
  }
  for (const s of stalni) {
    if (s.aktivan) {
      const vecUneto = (detaljiDana.get(`${mesec}-${String(s.danUMesecu).padStart(2, "0")}`) ?? [])
        .some((t) => t.opis === s.naziv);
      if (!vecUneto) {
        dodajPlan(s.danUMesecu, { naziv: s.naziv, iznosPara: s.iznosPara, tip: s.tip });
      }
    }
  }

  // Mreža kalendara (nedelja počinje ponedeljkom)
  const [godina, mesecBr] = mesec.split("-").map(Number);
  const prviUDanMesecu = new Date(godina, mesecBr - 1, 1).getDay(); // 0=ned
  const offset = (prviUDanMesecu + 6) % 7;
  const brojDana = new Date(godina, mesecBr, 0).getDate();
  const celije: Array<{ datum: string | null; dan: number | null }> = [];
  for (let i = 0; i < offset; i++) celije.push({ datum: null, dan: null });
  for (let d = 1; d <= brojDana; d++) {
    celije.push({
      datum: `${mesec}-${String(d).padStart(2, "0")}`,
      dan: d,
    });
  }
  while (celije.length % 7 !== 0) celije.push({ datum: null, dan: null });

  return (
    <>
      <NaslovStranice
        naslov="Kalendar"
        opis={`${formatMesec(mesec)} — klikni na dan za detalje.`}
      />

      <div className="space-y-6">
        <Sekcija naslov="Navigacija">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <Link href={`/kalendar?mesec=${prethodniMesec(mesec)}`} className="btn-ghost">
                ← Prethodni
              </Link>
              <Link href={`/kalendar?mesec=${tekuciMesec()}`} className="btn-ghost">
                Tekući
              </Link>
              <Link href={`/kalendar?mesec=${sledeciMesec(mesec)}`} className="btn-ghost">
                Sledeći →
              </Link>
            </div>
            <form method="get" className="flex items-end gap-2">
              <div>
                <label className="label" htmlFor="k-mesec">
                  Mesec
                </label>
                <input id="k-mesec" name="mesec" type="month" className="input" defaultValue={mesec} />
              </div>
              <button type="submit" className="btn-primary">
                Prikaži
              </button>
            </form>
          </div>
        </Sekcija>

        <Sekcija naslov={formatMesec(mesec)}>
          <div className="grid grid-cols-7 gap-1.5">
            {DANI_U_NEDELJI.map((d) => (
              <div key={d} className="pb-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {d}
              </div>
            ))}
            {celije.map((c, i) => {
              if (!c.datum || !c.dan) {
                return <div key={`prazno-${i}`} className="min-h-24 rounded-xl bg-slate-50/40 dark:bg-slate-800/20" />;
              }
              const s = poDanu.get(c.datum);
              const planovi = planPoDanu.get(c.dan) ?? [];
              const jeDanas = c.datum === danasDatum;
              const jeIzabran = c.datum === izabraniDan;
              return (
                <Link
                  key={c.datum}
                  href={`/kalendar?mesec=${mesec}&dan=${c.datum}`}
                  className={`group flex min-h-24 flex-col rounded-xl border p-1.5 transition-all duration-200 ${
                    jeIzabran
                      ? "hero-gradient border-transparent shadow-lg shadow-brand-500/25"
                      : "border-slate-200/70 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md dark:border-slate-800 dark:hover:border-brand-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex size-5.5 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                        jeDanas
                          ? "bg-brand-500 text-white shadow-sm"
                          : jeIzabran
                            ? "text-white"
                            : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {c.dan}
                    </span>
                    {s && s.broj > 0 ? (
                      <span className={`text-[10px] tabular-nums ${jeIzabran ? "text-white/70" : "text-slate-400"}`}>
                        {s.broj}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {s && s.prihod > 0 ? (
                      <p className={`truncate text-[10px] font-medium tabular-nums ${jeIzabran ? "text-white" : "text-emerald-600 dark:text-emerald-400"}`}>
                        +{formatRSD(s.prihod)}
                      </p>
                    ) : null}
                    {s && s.rashod > 0 ? (
                      <p className={`truncate text-[10px] font-medium tabular-nums ${jeIzabran ? "text-white" : "text-rose-600 dark:text-rose-400"}`}>
                        −{formatRSD(s.rashod)}
                      </p>
                    ) : null}
                    {planovi.map((p, idx) => (
                      <p
                        key={idx}
                        className={`truncate text-[10px] tabular-nums ${
                          jeIzabran ? "text-white/80" : p.tip === "prihod" ? "text-emerald-400 dark:text-emerald-500" : "text-rose-400 dark:text-rose-500"
                        }`}
                        title={`${p.naziv} (${formatRSD(p.iznosPara)})`}
                      >
                        ◦ {p.naziv}
                      </p>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            Svetli crveni/zeleni redovi su planirane stavke (rate i ponavljajući) koje još nisu unete.
          </p>
        </Sekcija>

        {izabraniDan && (
          <Sekcija naslov={`Detalji: ${formatDatum(izabraniDan)}`}>
            <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Dodaj transakciju za ovaj dan
              </p>
              <FormaTransakcije
                racuni={racuni.map((r) => ({ id: r.id, naziv: r.naziv }))}
                kategorije={kategorije.map((k) => ({
                  id: k.id,
                  naziv: k.naziv,
                  tip: k.tip,
                }))}
                podrazumevaniDatum={izabraniDan}
              />
            </div>

            {(detaljiDana.get(izabraniDan) ?? []).length === 0 &&
            (planPoDanu.get(Number(izabraniDan.split("-")[2])) ?? []).length === 0 ? (
              <Prazno tekst="Nema transakcija ni planiranih stavki za ovaj dan." />
            ) : (
              <>
                <ul className="divide-y divide-slate-100/80 dark:divide-slate-800/70">
                  {(detaljiDana.get(izabraniDan) ?? []).map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`size-2 shrink-0 rounded-full ${
                            t.tip === "prihod" ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{t.opis || t.kategorijaNaziv || "—"}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {t.racunNaziv}
                            {t.kategorijaNaziv ? ` · ${t.kategorijaNaziv}` : ""}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          t.tip === "prihod" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {t.tip === "prihod" ? "+" : "−"}
                        {formatRSD(t.iznosPara)}
                      </p>
                    </li>
                  ))}
                  {(planPoDanu.get(Number(izabraniDan.split("-")[2])) ?? []).map((p, i) => (
                    <li key={`plan-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                      <p className="text-sm italic text-slate-400 dark:text-slate-500">
                        ◦ {p.naziv} <span className="not-italic text-[10px] uppercase text-slate-400">(planirano)</span>
                      </p>
                      <p
                        className={`shrink-0 text-sm font-medium tabular-nums ${
                          p.tip === "prihod" ? "text-emerald-400 dark:text-emerald-500" : "text-rose-400 dark:text-rose-500"
                        }`}
                      >
                        {p.tip === "prihod" ? "+" : "−"}
                        {formatRSD(p.iznosPara)}
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex gap-5 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                  <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                    Prihod:{" "}
                    {formatRSD(
                      (detaljiDana.get(izabraniDan) ?? [])
                        .filter((t) => t.tip === "prihod")
                        .reduce((sum, t) => sum + t.iznosPara, 0),
                    )}
                  </span>
                  <span className="tabular-nums text-rose-600 dark:text-rose-400">
                    Rashod:{" "}
                    {formatRSD(
                      (detaljiDana.get(izabraniDan) ?? [])
                        .filter((t) => t.tip === "rashod")
                        .reduce((sum, t) => sum + t.iznosPara, 0),
                    )}
                  </span>
                </div>
              </>
            )}
          </Sekcija>
        )}
      </div>
    </>
  );
}
