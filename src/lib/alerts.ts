import { formatDatum, formatRSD, tekuciMesec } from "./format";
import type { BudzetSaPotrosnjom, KreditSaIzracunima } from "./queries";

export type NivoUpozorenja = "opasnost" | "upozorenje" | "info";

export type Upozorenje = {
  nivo: NivoUpozorenja;
  naslov: string;
  tekst: string;
};

const DANA_UNAPRED = 7;

function danaDo(isoDatum: string): number {
  const [g, m, d] = isoDatum.split("-").map(Number);
  const cilj = new Date(g, m - 1, d);
  const danas = new Date();
  const odNule = new Date(danas.getFullYear(), danas.getMonth(), danas.getDate());
  return Math.round((cilj.getTime() - odNule.getTime()) / 86_400_000);
}

export function izracunajUpozorenja(input: {
  ukupnoStanjePara: number;
  mesecTotals: { prihod: number; rashod: number };
  budzeti: BudzetSaPotrosnjom[];
  krediti: KreditSaIzracunima[];
  neprimenjenihStalnih?: number;
}): Upozorenje[] {
  const upozorenja: Upozorenje[] = [];
  const mesec = tekuciMesec();

  // 1. Negativno ukupno stanje
  if (input.ukupnoStanjePara < 0) {
    upozorenja.push({
      nivo: "opasnost",
      naslov: "Negativno stanje",
      tekst: `Ukupno stanje je ${formatRSD(input.ukupnoStanjePara)}. Odmah smanji trošenje.`,
    });
  }

  // 2. Trošiš više nego što zarađuješ ovog meseca
  const { prihod, rashod } = input.mesecTotals;
  if (rashod > prihod && rashod > 0) {
    upozorenja.push({
      nivo: "opasnost",
      naslov: "Mesečni deficit",
      tekst: `Ovog meseca rashodi (${formatRSD(rashod)}) premašuju prihode (${formatRSD(prihod)}) za ${formatRSD(
        rashod - prihod,
      )}.`,
    });
  } else if (prihod - rashod > 0 && prihod > 0) {
    upozorenja.push({
      nivo: "info",
      naslov: "Mesečni suficit",
      tekst: `Ovog meseca ostaje ti ${formatRSD(prihod - rashod)} više nego što si potrošio/la. Usmeri to u otplatu kredita ili štednju.`,
    });
  }

  // 3. Rate kredita — dospeli rokovi i skori rokovi
  for (const k of input.krediti) {
    if (!k.aktivan || !k.sledecaRataDatum || k.preostaloRata === 0) continue;
    const dana = danaDo(k.sledecaRataDatum);
    if (dana < 0) {
      upozorenja.push({
        nivo: "opasnost",
        naslov: `Rata kasni: ${k.naziv}`,
        tekst: `Rok za ovu ratu (${formatDatum(k.sledecaRataDatum)}) je prošao. Iznos rate: ${formatRSD(k.rataPara)}.`,
      });
    } else if (dana <= DANA_UNAPRED) {
      upozorenja.push({
        nivo: dana <= 2 ? "opasnost" : "upozorenje",
        naslov: `Rata na vidiku: ${k.naziv}`,
        tekst:
          dana === 0
            ? `Rata od ${formatRSD(k.rataPara)} dospeva danas.`
            : `Rata od ${formatRSD(k.rataPara)} dospeva za ${dana} dana (${formatDatum(k.sledecaRataDatum)}).`,
      });
    }
  }

  // 4. Da li stanje pokriva sve rate do kraja meseca?
  const rateOvogMeseca = input.krediti
    .filter((k) => k.aktivan && k.sledecaRataDatum?.startsWith(mesec))
    .reduce((s, k) => s + k.rataPara, 0);
  if (rateOvogMeseca > 0 && input.ukupnoStanjePara < rateOvogMeseca) {
    upozorenja.push({
      nivo: "opasnost",
      naslov: "Stanje ne pokriva rate",
      tekst: `Za rate do kraja meseca potrebno je ${formatRSD(rateOvogMeseca)}, a ukupno stanje je ${formatRSD(
        input.ukupnoStanjePara,
      )}.`,
    });
  }

  // 5. Ponavljajuće stavke koje čekaju unos
  if ((input.neprimenjenihStalnih ?? 0) > 0) {
    upozorenja.push({
      nivo: "upozorenje",
      naslov: "Ponavljajuće stavke čekaju unos",
      tekst: `${input.neprimenjenihStalnih} ponavljajućih stavki nije uneto za ovaj mesec. Otvori "Ponavljajuće" i klikni "Unesi sve".`,
    });
  }

  // 6. Budžeti — prekoračenje i približavanje limitu
  for (const b of input.budzeti) {
    if (b.limitPara <= 0) continue;
    const procenat = Math.round((b.potrosnjaPara / b.limitPara) * 100);
    if (procenat >= 100) {
      upozorenja.push({
        nivo: "opasnost",
        naslov: `Budžet prekoračen: ${b.naziv}`,
        tekst: `Potrošeno ${formatRSD(b.potrosnjaPara)} od ${formatRSD(b.limitPara)} (${procenat}%).`,
      });
    } else if (procenat >= 80) {
      upozorenja.push({
        nivo: "upozorenje",
        naslov: `Budžet na granici: ${b.naziv}`,
        tekst: `Potrošeno ${procenat}% budžeta — ostalo je ${formatRSD(b.limitPara - b.potrosnjaPara)}.`,
      });
    }
  }

  // Sortiraj po ozbiljnosti
  const redosled: Record<NivoUpozorenja, number> = { opasnost: 0, upozorenje: 1, info: 2 };
  return upozorenja.sort((a, b) => redosled[a.nivo] - redosled[b.nivo]);
}
