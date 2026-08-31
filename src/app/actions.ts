"use server";

import { and, eq, gte, isNotNull, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { budzeti, kategorije, krediti, racuni, stalneStavke, transakcije } from "@/db/schema";
import { danas, parseDatum, tekuciMesec, toPara } from "@/lib/format";

export type FormState = { error?: string; ok?: boolean };

function revalidujSve() {
  for (const p of ["/", "/transakcije", "/budzeti", "/krediti", "/izvestaji"]) {
    revalidatePath(p);
  }
}

const iznosSchema = z
  .string()
  .refine((v) => !Number.isNaN(toPara(v)) && toPara(v) > 0, {
    message: "Iznos mora biti pozitivan broj.",
  });

export async function dodajTransakciju(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const datumISO = parseDatum(String(formData.get("datum") ?? ""));
  if (!datumISO) {
    return { error: "Datum nije validan. Koristi format DD-MM-YYYY." };
  }

  const parsed = z
    .object({
      tip: z.enum(["prihod", "rashod"]),
      iznos: iznosSchema,
      racunId: z.coerce.number().int().positive(),
      kategorijaId: z.union([z.literal(""), z.coerce.number().int().positive()]),
      opis: z.string().max(200).optional(),
    })
    .safeParse({
      tip: formData.get("tip"),
      iznos: formData.get("iznos"),
      racunId: formData.get("racunId"),
      kategorijaId: formData.get("kategorijaId") ?? "",
      opis: formData.get("opis") ?? "",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neispravan unos." };
  }
  const d = parsed.data;

  await db.insert(transakcije).values({
    racunId: d.racunId,
    kategorijaId: d.kategorijaId === "" ? null : d.kategorijaId,
    tip: d.tip,
    iznosPara: toPara(d.iznos),
    datum: datumISO,
    opis: d.opis?.trim() ?? "",
  });

  revalidujSve();
  return { ok: true };
}

export async function obrisiTransakciju(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) {
    await db.delete(transakcije).where(eq(transakcije.id, id));
    revalidujSve();
  }
}

export async function postaviBudzet(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      mesec: z.string().regex(/^\d{4}-\d{2}$/),
      kategorijaId: z.coerce.number().int().positive(),
      limit: iznosSchema,
    })
    .safeParse({
      mesec: formData.get("mesec"),
      kategorijaId: formData.get("kategorijaId"),
      limit: formData.get("limit"),
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neispravan unos." };
  }
  const d = parsed.data;

  await db
    .insert(budzeti)
    .values({ mesec: d.mesec, kategorijaId: d.kategorijaId, limitPara: toPara(d.limit) })
    .onConflictDoUpdate({
      target: [budzeti.mesec, budzeti.kategorijaId],
      set: { limitPara: toPara(d.limit) },
    });

  revalidujSve();
  return { ok: true };
}

export async function obrisiBudzet(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) {
    await db.delete(budzeti).where(eq(budzeti.id, id));
    revalidujSve();
  }
}

export async function dodajKredit(_prev: FormState, formData: FormData): Promise<FormState> {
  const datumPocetkaISO = parseDatum(String(formData.get("datumPocetka") ?? ""));
  if (!datumPocetkaISO) {
    return { error: "Datum početka nije validan. Koristi format DD-MM-YYYY." };
  }

  const parsed = z
    .object({
      naziv: z.string().min(1, "Naziv je obavezan.").max(100),
      glavnica: z.string().refine((v) => v === "" || !Number.isNaN(toPara(v)), {
        message: "Glavnica nije validna.",
      }),
      kamatnaStopa: z.coerce.number().min(0).max(100),
      rata: iznosSchema,
      ukupnoRata: z.coerce.number().int().min(1, "Broj rata mora biti najmanje 1."),
      placenoRata: z.coerce.number().int().min(0).default(0),
      danNaplate: z.coerce.number().int().min(1).max(28),
      racunId: z.union([z.literal(""), z.coerce.number().int().positive()]),
    })
    .safeParse({
      naziv: formData.get("naziv"),
      glavnica: formData.get("glavnica") ?? "",
      kamatnaStopa: formData.get("kamatnaStopa"),
      rata: formData.get("rata"),
      ukupnoRata: formData.get("ukupnoRata"),
      placenoRata: formData.get("placenoRata") ?? "0",
      danNaplate: formData.get("danNaplate"),
      racunId: formData.get("racunId") ?? "",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neispravan unos." };
  }
  const d = parsed.data;
  if (d.placenoRata > d.ukupnoRata) {
    return { error: "Plaćeno rata ne može biti više od ukupnog broja rata." };
  }

  await db.insert(krediti).values({
    naziv: d.naziv.trim(),
    glavnicaPara: d.glavnica === "" ? 0 : toPara(d.glavnica),
    kamatnaStopa: d.kamatnaStopa,
    rataPara: toPara(d.rata),
    ukupnoRata: d.ukupnoRata,
    placenoRata: d.placenoRata,
    danNaplate: d.danNaplate,
    datumPocetka: datumPocetkaISO,
    racunId: d.racunId === "" ? null : d.racunId,
  });

  revalidujSve();
  return { ok: true };
}

export async function platiRatu(formData: FormData): Promise<void> {
  const kreditId = Number(formData.get("kreditId"));
  if (!Number.isInteger(kreditId)) return;

  const [k] = await db.select().from(krediti).where(eq(krediti.id, kreditId)).limit(1);
  if (!k || k.placenoRata >= k.ukupnoRata) return;

  // Kategorija "Rate kredita" — nađi ili napravi
  let [kat] = await db
    .select()
    .from(kategorije)
    .where(and(eq(kategorije.naziv, "Rate kredita"), eq(kategorije.tip, "rashod")))
    .limit(1);
  if (!kat) {
    [kat] = await db
      .insert(kategorije)
      .values({ naziv: "Rate kredita", tip: "rashod", boja: "#dc2626" })
      .returning();
  }

  // Račun za naplatu: definisan na kreditu, inače prvi aktivan
  let racunId = k.racunId;
  if (!racunId) {
    const [r] = await db.select().from(racuni).where(eq(racuni.aktivan, true)).limit(1);
    racunId = r?.id;
  }
  if (!racunId) return;

  const novaPlacena = k.placenoRata + 1;
  await db.transaction(async (tx) => {
    await tx.insert(transakcije).values({
      racunId,
      kategorijaId: kat.id,
      kreditId: k.id,
      tip: "rashod",
      iznosPara: Number(k.rataPara),
      datum: danas(),
      opis: `Rata ${novaPlacena}/${k.ukupnoRata} — ${k.naziv}`,
    });
    await tx.update(krediti)
      .set({
        placenoRata: novaPlacena,
        aktivan: novaPlacena < k.ukupnoRata ? true : false,
      })
      .where(eq(krediti.id, k.id));
  });

  revalidujSve();
}

export async function obrisiKredit(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) {
    await db.delete(krediti).where(eq(krediti.id, id));
    revalidujSve();
  }
}

export async function dodajRacun(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      naziv: z.string().min(1, "Naziv je obavezan.").max(60),
      tip: z.enum(["kes", "tekuci", "kartica", "stednja"]),
      pocetnoStanje: z.string().refine((v) => v === "" || !Number.isNaN(toPara(v)), {
        message: "Početno stanje nije validno.",
      }),
    })
    .safeParse({
      naziv: formData.get("naziv"),
      tip: formData.get("tip"),
      pocetnoStanje: formData.get("pocetnoStanje") ?? "",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neispravan unos." };
  }
  const d = parsed.data;

  await db.insert(racuni).values({
    naziv: d.naziv.trim(),
    tip: d.tip,
    pocetnoStanjePara: d.pocetnoStanje === "" ? 0 : toPara(d.pocetnoStanje),
  });

  revalidujSve();
  return { ok: true };
}

/** Brzo kopiranje budžeta iz prethodnog meseca (samo kategorije koje još nemaju budžet). */
export async function kopirajBudzeteIzPrethodnogMeseca(): Promise<void> {
  const mesec = tekuciMesec();
  const [g, m] = mesec.split("-").map(Number);
  const prethodni =
    m === 1 ? `${g - 1}-12` : `${g}-${String(m - 1).padStart(2, "0")}`;

  const stari = await db.select().from(budzeti).where(eq(budzeti.mesec, prethodni));
  for (const b of stari) {
    await db
      .insert(budzeti)
      .values({ mesec, kategorijaId: b.kategorijaId, limitPara: Number(b.limitPara) })
      .onConflictDoNothing();
  }
  revalidujSve();
}

export async function dodajStalnu(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      naziv: z.string().min(1, "Naziv je obavezan.").max(100),
      tip: z.enum(["prihod", "rashod"]),
      iznos: iznosSchema,
      danUMesecu: z.coerce.number().int().min(1).max(28),
      kategorijaId: z.union([z.literal(""), z.coerce.number().int().positive()]),
      racunId: z.union([z.literal(""), z.coerce.number().int().positive()]),
    })
    .safeParse({
      naziv: formData.get("naziv"),
      tip: formData.get("tip"),
      iznos: formData.get("iznos"),
      danUMesecu: formData.get("danUMesecu"),
      kategorijaId: formData.get("kategorijaId") ?? "",
      racunId: formData.get("racunId") ?? "",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Neispravan unos." };
  }
  const d = parsed.data;

  await db.insert(stalneStavke).values({
    naziv: d.naziv.trim(),
    tip: d.tip,
    iznosPara: toPara(d.iznos),
    danUMesecu: d.danUMesecu,
    kategorijaId: d.kategorijaId === "" ? null : d.kategorijaId,
    racunId: d.racunId === "" ? null : d.racunId,
  });

  revalidujSve();
  return { ok: true };
}

export async function obrisiStalnu(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (Number.isInteger(id)) {
    await db.delete(stalneStavke).where(eq(stalneStavke.id, id));
    revalidujSve();
  }
}

export async function promeniStatusStalne(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const aktivan = formData.get("aktivan") === "1";
  if (Number.isInteger(id)) {
    await db.update(stalneStavke).set({ aktivan }).where(eq(stalneStavke.id, id));
    revalidujSve();
  }
}

/** Unosi sve aktivne ponavljajuće stavke za mesec (preskače već unete). */
export async function primeniStalne(formData: FormData): Promise<void> {
  const mesecRaw = String(formData.get("mesec") ?? "");
  const mesec = /^\d{4}-\d{2}$/.test(mesecRaw) ? mesecRaw : tekuciMesec();
  const od = `${mesec}-01`;
  const do_ = `${mesec}-31`;

  const [stavke, postojeci] = await Promise.all([
    db.select().from(stalneStavke).where(eq(stalneStavke.aktivan, true)),
    db
      .select({ sid: transakcije.stalnaId })
      .from(transakcije)
      .where(
        and(
          isNotNull(transakcije.stalnaId),
          gte(transakcije.datum, od),
          lte(transakcije.datum, do_),
        ),
      ),
  ]);
  const uneto = new Set(postojeci.map((r) => r.sid));

  const [prvi] = await db.select().from(racuni).where(eq(racuni.aktivan, true)).limit(1);
  if (!prvi) return;

  for (const s of stavke) {
    if (uneto.has(s.id)) continue;
    await db.insert(transakcije).values({
      racunId: s.racunId ?? prvi.id,
      kategorijaId: s.kategorijaId,
      stalnaId: s.id,
      tip: s.tip,
      iznosPara: Number(s.iznosPara),
      datum: `${mesec}-${String(s.danUMesecu).padStart(2, "0")}`,
      opis: s.naziv,
    });
  }

  revalidujSve();
}
