import { and, asc, desc, eq, gte, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { budzeti, kategorije, krediti, racuni, stalneStavke, transakcije } from "@/db/schema";

function mesecOpseg(mesec: string): { od: string; do_: string } {
  return { od: `${mesec}-01`, do_: `${mesec}-31` };
}

export type RacunSaStanjem = {
  id: number;
  naziv: string;
  tip: string;
  stanjePara: number;
};

export async function racuniSaStanjem(): Promise<RacunSaStanjem[]> {
  const rows = await db
    .select({
      id: racuni.id,
      naziv: racuni.naziv,
      tip: racuni.tip,
      pocetno: racuni.pocetnoStanjePara,
      prihodi: sql<string>`coalesce(sum(case when ${transakcije.tip} = 'prihod' then ${transakcije.iznosPara} else 0 end), 0)`,
      rashodi: sql<string>`coalesce(sum(case when ${transakcije.tip} = 'rashod' then ${transakcije.iznosPara} else 0 end), 0)`,
    })
    .from(racuni)
    .leftJoin(transakcije, eq(transakcije.racunId, racuni.id))
    .where(eq(racuni.aktivan, true))
    .groupBy(racuni.id)
    .orderBy(asc(racuni.id));

  return rows.map((r) => ({
    id: r.id,
    naziv: r.naziv,
    tip: r.tip,
    stanjePara: Number(r.pocetno) + Number(r.prihodi) - Number(r.rashodi),
  }));
}

export async function mesecTotals(mesec: string): Promise<{ prihod: number; rashod: number }> {
  const { od, do_ } = mesecOpseg(mesec);
  const [row] = await db
    .select({
      prihod: sql<string>`coalesce(sum(case when ${transakcije.tip} = 'prihod' then ${transakcije.iznosPara} else 0 end), 0)`,
      rashod: sql<string>`coalesce(sum(case when ${transakcije.tip} = 'rashod' then ${transakcije.iznosPara} else 0 end), 0)`,
    })
    .from(transakcije)
    .where(and(gte(transakcije.datum, od), lte(transakcije.datum, do_)));

  return { prihod: Number(row?.prihod ?? 0), rashod: Number(row?.rashod ?? 0) };
}

export type TransakcijaRed = {
  id: number;
  datum: string;
  tip: string;
  iznosPara: number;
  opis: string;
  kategorijaNaziv: string | null;
  kategorijaBoja: string | null;
  racunNaziv: string;
  kreditId: number | null;
};

export async function listaTransakcija(opts: {
  mesec?: string;
  tip?: string;
  kategorijaId?: number;
  limit?: number;
}): Promise<TransakcijaRed[]> {
  const uslovi = [];
  if (opts.mesec) {
    const { od, do_ } = mesecOpseg(opts.mesec);
    uslovi.push(and(gte(transakcije.datum, od), lte(transakcije.datum, do_)));
  }
  if (opts.tip === "prihod" || opts.tip === "rashod") {
    uslovi.push(eq(transakcije.tip, opts.tip));
  }
  if (opts.kategorijaId) {
    uslovi.push(eq(transakcije.kategorijaId, opts.kategorijaId));
  }

  const rows = await db
    .select({
      id: transakcije.id,
      datum: transakcije.datum,
      tip: transakcije.tip,
      iznosPara: transakcije.iznosPara,
      opis: transakcije.opis,
      kategorijaNaziv: kategorije.naziv,
      kategorijaBoja: kategorije.boja,
      racunNaziv: racuni.naziv,
      kreditId: transakcije.kreditId,
    })
    .from(transakcije)
    .leftJoin(kategorije, eq(transakcije.kategorijaId, kategorije.id))
    .innerJoin(racuni, eq(transakcije.racunId, racuni.id))
    .where(uslovi.length ? and(...uslovi) : undefined)
    .orderBy(desc(transakcije.datum), desc(transakcije.id))
    .limit(opts.limit ?? 200);

  return rows.map((r) => ({ ...r, iznosPara: Number(r.iznosPara) }));
}

export type BudzetSaPotrosnjom = {
  id: number;
  kategorijaId: number;
  naziv: string;
  boja: string;
  limitPara: number;
  potrosnjaPara: number;
};

export async function budzetiSaPotrosnjom(mesec: string): Promise<BudzetSaPotrosnjom[]> {
  const { od, do_ } = mesecOpseg(mesec);

  const rows = await db
    .select({
      id: budzeti.id,
      kategorijaId: budzeti.kategorijaId,
      naziv: kategorije.naziv,
      boja: kategorije.boja,
      limitPara: budzeti.limitPara,
      potrosnja: sql<string>`coalesce((
        select sum(t.iznos_para) from transakcije t
        where t.kategorija_id = ${budzeti.kategorijaId}
          and t.tip = 'rashod'
          and t.datum >= ${od} and t.datum <= ${do_}
      ), 0)`,
    })
    .from(budzeti)
    .innerJoin(kategorije, eq(budzeti.kategorijaId, kategorije.id))
    .where(eq(budzeti.mesec, mesec))
    .orderBy(asc(kategorije.naziv));

  return rows.map((r) => ({
    id: r.id,
    kategorijaId: r.kategorijaId,
    naziv: r.naziv,
    boja: r.boja,
    limitPara: Number(r.limitPara),
    potrosnjaPara: Number(r.potrosnja),
  }));
}

export type KreditSaIzracunima = {
  id: number;
  naziv: string;
  glavnicaPara: number;
  kamatnaStopa: number;
  rataPara: number;
  ukupnoRata: number;
  placenoRata: number;
  danNaplate: number;
  datumPocetka: string;
  aktivan: boolean;
  preostaloRata: number;
  preostaliDugPara: number;
  sledecaRataDatum: string | null;
};

/** Sledeći datum naplate rate u odnosu na danas (lokalna zona). */
export function sledecaNaplata(danNaplate: number, today = new Date()): Date {
  const y = today.getFullYear();
  const m = today.getMonth();
  const posledjiDanUMesecu = new Date(y, m + 1, 0).getDate();
  const dan = Math.min(danNaplate, posledjiDanUMesecu);
  const ovajMesec = new Date(y, m, dan);
  if (ovajMesec >= new Date(y, m, today.getDate())) return ovajMesec;
  const posledjiDanSledeceg = new Date(y, m + 2, 0).getDate();
  return new Date(y, m + 1, Math.min(danNaplate, posledjiDanSledeceg));
}

export async function listaKredita(samoAktivni = false): Promise<KreditSaIzracunima[]> {
  const rows = await db
    .select()
    .from(krediti)
    .where(samoAktivni ? eq(krediti.aktivan, true) : undefined)
    .orderBy(asc(krediti.aktivan), asc(krediti.id));

  return rows.map((k) => {
    const preostaloRata = Math.max(0, k.ukupnoRata - k.placenoRata);
    const sledeca =
      preostaloRata > 0 ? sledecaNaplata(k.danNaplate) : null;
    return {
      ...k,
      glavnicaPara: Number(k.glavnicaPara),
      rataPara: Number(k.rataPara),
      preostaloRata,
      preostaliDugPara: preostaloRata * Number(k.rataPara),
      sledecaRataDatum: sledeca
        ? `${sledeca.getFullYear()}-${String(sledeca.getMonth() + 1).padStart(2, "0")}-${String(
            sledeca.getDate(),
          ).padStart(2, "0")}`
        : null,
    };
  });
}

export async function potrosnjaPoKategoriji(
  mesec: string,
): Promise<Array<{ naziv: string; boja: string; iznosPara: number }>> {
  const { od, do_ } = mesecOpseg(mesec);
  const rows = await db
    .select({
      naziv: kategorije.naziv,
      boja: kategorije.boja,
      iznos: sql<string>`coalesce(sum(${transakcije.iznosPara}), 0)`,
    })
    .from(transakcije)
    .innerJoin(kategorije, eq(transakcije.kategorijaId, kategorije.id))
    .where(
      and(
        eq(transakcije.tip, "rashod"),
        gte(transakcije.datum, od),
        lte(transakcije.datum, do_),
      ),
    )
    .groupBy(kategorije.id)
    .orderBy(desc(sql`sum(${transakcije.iznosPara})`));

  return rows.map((r) => ({ naziv: r.naziv, boja: r.boja, iznosPara: Number(r.iznos) }));
}

export async function totalsPoMesecima(
  meseci: string[],
): Promise<Array<{ mesec: string; prihod: number; rashod: number }>> {
  const rezultat: Array<{ mesec: string; prihod: number; rashod: number }> = [];
  for (const mesec of meseci) {
    rezultat.push({ mesec, ...(await mesecTotals(mesec)) });
  }
  return rezultat;
}

export async function sveKategorije() {
  return db.select().from(kategorije).orderBy(asc(kategorije.tip), asc(kategorije.naziv));
}

export async function aktivniRacuni() {
  return db.select().from(racuni).where(eq(racuni.aktivan, true)).orderBy(asc(racuni.id));
}

export type StalnaStavka = {
  id: number;
  naziv: string;
  tip: string;
  iznosPara: number;
  danUMesecu: number;
  kategorijaId: number | null;
  kategorijaNaziv: string | null;
  racunId: number | null;
  racunNaziv: string | null;
  aktivan: boolean;
};

export async function listaStalnih(): Promise<StalnaStavka[]> {
  const rows = await db
    .select({
      id: stalneStavke.id,
      naziv: stalneStavke.naziv,
      tip: stalneStavke.tip,
      iznosPara: stalneStavke.iznosPara,
      danUMesecu: stalneStavke.danUMesecu,
      kategorijaId: stalneStavke.kategorijaId,
      kategorijaNaziv: kategorije.naziv,
      racunId: stalneStavke.racunId,
      racunNaziv: racuni.naziv,
      aktivan: stalneStavke.aktivan,
    })
    .from(stalneStavke)
    .leftJoin(kategorije, eq(stalneStavke.kategorijaId, kategorije.id))
    .leftJoin(racuni, eq(stalneStavke.racunId, racuni.id))
    .orderBy(asc(stalneStavke.tip), asc(stalneStavke.danUMesecu), asc(stalneStavke.id));

  return rows.map((r) => ({ ...r, iznosPara: Number(r.iznosPara) }));
}

/** IDs stalnih stavki koje su već unete kao transakcije u datom mesecu. */
export async function primenjeneStalne(mesec: string): Promise<Set<number>> {
  const { od, do_ } = mesecOpseg(mesec);
  const rows = await db
    .select({ sid: transakcije.stalnaId })
    .from(transakcije)
    .where(
      and(
        isNotNull(transakcije.stalnaId),
        gte(transakcije.datum, od),
        lte(transakcije.datum, do_),
      ),
    );
  return new Set(rows.map((r) => r.sid).filter((v): v is number => v !== null));
}
