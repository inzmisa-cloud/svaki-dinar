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
  opasnost: "border-red-300 bg-red-50",
  upozorenje: "border-amber-300 bg-amber-50",
  info: "border-sky-200 bg-sky-50",
} as const;

const NIVO_LABEL = {
  opasnost: "Opasnost",
  upozorenje: "Upozorenje",
  info: "Info",
} as const;

const NIVO_TEKST = {
  opasnost: "text-red-700",
  upozorenje: "text-amber-700",
  info: "text-sky-700",
} as const;

export default async function Pregled() {
  const mesec = tekuciMesec();
  const [racuni, totals, budzeti, krediti, poslednje, stalni, uneteStalne] = await Promise.all([
    racuniSaStanjem(),
    mesecTotals(mesec),
    budzetiSaPotrosnjom(mesec),
    listaKredita(true),
    listaTransakcija({ limit: 8 }),
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="lg:col-span-1">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatKartica
              naslov="Ukupno stanje"
              vrednost={formatRSD(ukupnoStanje)}
              ton={ukupnoStanje < 0 ? "negativno" : "neutral"}
            />
            <StatKartica naslov="Prihod (mesec)" vrednost={formatRSD(totals.prihod)} ton="pozitivno" />
            <StatKartica naslov="Rashod (mesec)" vrednost={formatRSD(totals.rashod)} ton="negativno" />
            <StatKartica
              naslov="Neto (mesec)"
              vrednost={formatRSD(neto)}
              ton={neto < 0 ? "negativno" : "pozitivno"}
            />
          </div>

          {upozorenja.length > 0 && (
            <Sekcija naslov={`Upozorenja (${upozorenja.length})`}>
              <ul className="space-y-3">
                {upozorenja.map((u, i) => (
                  <li key={i} className="rounded-lg p-3 flex items-start gap-3">
                    <div
                      className={`rounded-lg ${
                        NIVO_STIL[u.nivo]
                      } flex-shrink-0 w-8 h-8 flex items-center justify-center`}
                    >
                      <p className={`text-xs font-semibold ${NIVO_TEKST[u.nivo]}`}>
                        {NIVO_LABEL[u.nivo]}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold uppercase">{NIVO_LABEL[u.nivo]}</p>
                      <p className="mt-0.5 text-sm font-medium">{u.naslov}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{u.tekst}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Sekcija>
          )}

          {!rateNaVidiku.length ? (
            <Prazno tekst="Nema aktivnih rata." />
          ) : (
            <Sekcija naslov="Rate na vidiku">
              <ul className="divide-y divide-slate-100">
                {rateNaVidiku.map((k) => (
                  <li key={k.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium">{k.naziv}</p>
                      <p className="text-xs text-slate-500">
                        {formatDatum(k.sledecaRataDatum!)} · ostalo {k.preostaloRata} rata
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-red-600">
                      −{formatRSD(k.rataPara)}
                    </p>
                  </li>
                ))}
              </ul>
            </Sekcija>
          )}

          <Sekcija naslov="Računi">
            {racuni.length === 0 ? (
              <Prazno tekst="Dodaj prvi račun kroz formu za transakcije." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {racuni.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2.5">
                    <p className="text-sm font-medium capitalize">{r.naziv}</p>
                    <p
                      className={`text-sm font-semibold tabular-nums ${
                        r.stanjePara < 0 ? "text-red-600" : ""
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

        <div className="lg:col-span-1">
          <Sekcija
            naslov="Ponavljajuće stavke (mesečno)"
            akcija={
              <Link href="/ponavljajuce" className="text-xs font-medium text-slate-500 hover:text-slate-900">
                Upravljaj →
              </Link>
            }
          >
            <ul className="grid grid-cols-2 gap-x-8 sm:grid-cols-2">
              {aktivniStalni.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{s.naziv}</p>
                    <p className="text-xs text-slate-500">
                      {s.danUMesecu}. u mesecu ·{" "}
                      {uneteStalne.has(s.id) ? (
                        <span className="text-green-600">uneto</span>
                      ) : (
                        <span className="text-amber-600">čekaunos</span>
                      )}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      s.tip === "prihod" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {s.tip === "prihod" ? "+" : "−"}
                    {formatRSD(s.iznosPara)}
                  </p>
                </li>
              ))}
            </ul>
          </Sekcija>

          <Sekcija
            naslov="Skorašnje transakcije"
            akcija={
              <Link href="/transakcije" className="text-xs font-medium text-slate-500 hover:text-slate-900">
                Sve transakcije →
              </Link>
            }
          >
            {poslednje.length === 0 ? (
              <Prazno tekst="Još nema transakcija. Zabeleži prvu — svaki dinar se računa." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {poslednje.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {t.opis || t.kategorijaNaziv || "Bez opisa"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDatum(t.datum)} · {t.racunNaziv}
                        {t.kategorijaNaziv ? ` · ${t.kategorijaNaziv}` : ""}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        t.tip === "prihod" ? "text-green-600" : "text-red-600"
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