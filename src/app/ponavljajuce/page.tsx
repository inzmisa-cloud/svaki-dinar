import { obrisiStalnu, primeniStalne, promeniStatusStalne } from "@/app/actions";
import { NaslovStranice, Prazno, Sekcija } from "@/components/ui";
import { formatRSD, tekuciMesec } from "@/lib/format";
import {
  aktivniRacuni,
  listaStalnih,
  primenjeneStalne,
  sveKategorije,
} from "@/lib/queries";
import { FormaStalne } from "./forma";

export const dynamic = "force-dynamic";

export default async function PonavljajucePage() {
  const mesec = tekuciMesec();
  const [stavke, unete, racuni, kategorije] = await Promise.all([
    listaStalnih(),
    primenjeneStalne(mesec),
    aktivniRacuni(),
    sveKategorije(),
  ]);

  const aktivne = stavke.filter((s) => s.aktivan);
  const neprimenjene = aktivne.filter((s) => !unete.has(s.id)).length;
  const mesecniPrihod = aktivne
    .filter((s) => s.tip === "prihod")
    .reduce((sum, s) => sum + s.iznosPara, 0);
  const mesecniRashod = aktivne
    .filter((s) => s.tip === "rashod")
    .reduce((sum, s) => sum + s.iznosPara, 0);

  return (
    <>
      <NaslovStranice
        naslov="Ponavljajuće stavke"
        opis="Plata, kirija, režije… uneseš jednom — svaki mesec se dodaju jednim klikom."
      />

      <div className="space-y-6">
        <Sekcija naslov="Unos za ovaj mesec">
          <div className="flex flex-wrap items-center gap-3">
            <form action={primeniStalne}>
              <input type="hidden" name="mesec" value={mesec} />
              <button type="submit" className="btn-primary" disabled={aktivne.length === 0}>
                Unesi sve za tekući mesec
              </button>
            </form>
            <p className="text-sm text-slate-500">
              {aktivne.length === 0
                ? "Prvo dodaj stavke ispod."
                : neprimenjene === 0
                  ? "Sve je uneto za tekući mesec."
                  : `${neprimenjene} stavki čeka unos.`}
            </p>
          </div>
        </Sekcija>

        <Sekcija naslov="Nova ponavljajuća stavka">
          <FormaStalne
            racuni={racuni.map((r) => ({ id: r.id, naziv: r.naziv }))}
            kategorije={kategorije.map((k) => ({ id: k.id, naziv: k.naziv, tip: k.tip }))}
          />
        </Sekcija>

        <Sekcija
          naslov={`Spisak (${stavke.length})`}
          akcija={
            <span className="text-xs tabular-nums text-slate-500">
              mesečno: <span className="font-medium text-green-600">+{formatRSD(mesecniPrihod)}</span>{" "}
              / <span className="font-medium text-red-600">−{formatRSD(mesecniRashod)}</span>
            </span>
          }
        >
          {stavke.length === 0 ? (
            <Prazno tekst="Nema ponavljajućih stavki." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {stavke.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {s.naziv}
                      {!s.aktivan ? (
                        <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                          pauzirano
                        </span>
                      ) : unete.has(s.id) ? (
                        <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-700">
                          uneto
                        </span>
                      ) : (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                          čeka unos
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.danUMesecu}. u mesecu · {s.kategorijaNaziv ?? "bez kategorije"} ·{" "}
                      {s.racunNaziv ?? "prvi aktivan račun"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        s.tip === "prihod" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {s.tip === "prihod" ? "+" : "−"}
                      {formatRSD(s.iznosPara)}
                    </span>
                    <form action={promeniStatusStalne}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="aktivan" value={s.aktivan ? "0" : "1"} />
                      <button type="submit" className="btn-ghost !px-2.5 !py-1.5 text-xs">
                        {s.aktivan ? "Pauziraj" : "Aktiviraj"}
                      </button>
                    </form>
                    <form action={obrisiStalnu}>
                      <input type="hidden" name="id" value={s.id} />
                      <button type="submit" className="btn-danger">
                        Obriši
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Sekcija>
      </div>
    </>
  );
}
