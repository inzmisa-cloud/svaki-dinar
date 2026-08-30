import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const racuni = sqliteTable("racuni", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  naziv: text("naziv").notNull(),
  tip: text("tip").notNull().default("tekuci"), // kes | tekuci | kartica | stednja
  pocetnoStanjePara: integer("pocetno_stanje_para").notNull().default(0),
  aktivan: integer("aktivan", { mode: "boolean" }).notNull().default(true),
});

export const kategorije = sqliteTable("kategorije", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  naziv: text("naziv").notNull(),
  tip: text("tip").notNull(), // prihod | rashod
  boja: text("boja").notNull().default("#64748b"),
});

export const krediti = sqliteTable("krediti", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  naziv: text("naziv").notNull(),
  glavnicaPara: integer("glavnica_para").notNull().default(0),
  kamatnaStopa: real("kamatna_stopa").notNull().default(0), // godisnja, %
  rataPara: integer("rata_para").notNull(),
  ukupnoRata: integer("ukupno_rata").notNull(),
  placenoRata: integer("placeno_rata").notNull().default(0),
  danNaplate: integer("dan_naplate").notNull().default(1), // 1-28
  datumPocetka: text("datum_pocetka").notNull(), // YYYY-MM-DD
  racunId: integer("racun_id").references(() => racuni.id),
  aktivan: integer("aktivan", { mode: "boolean" }).notNull().default(true),
});

export const transakcije = sqliteTable("transakcije", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  racunId: integer("racun_id")
    .notNull()
    .references(() => racuni.id),
  kategorijaId: integer("kategorija_id").references(() => kategorije.id, {
    onDelete: "set null",
  }),
  kreditId: integer("kredit_id").references(() => krediti.id, {
    onDelete: "set null",
  }),
  stalnaId: integer("stalna_id").references(() => stalneStavke.id, {
    onDelete: "set null",
  }),
  tip: text("tip").notNull(), // prihod | rashod
  iznosPara: integer("iznos_para").notNull(),
  datum: text("datum").notNull(), // YYYY-MM-DD
  opis: text("opis").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const stalneStavke = sqliteTable("stalne_stavke", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  naziv: text("naziv").notNull(),
  tip: text("tip").notNull(), // prihod | rashod
  iznosPara: integer("iznos_para").notNull(),
  danUMesecu: integer("dan_u_mesecu").notNull().default(1), // 1-28
  kategorijaId: integer("kategorija_id").references(() => kategorije.id, {
    onDelete: "set null",
  }),
  racunId: integer("racun_id").references(() => racuni.id, { onDelete: "set null" }),
  aktivan: integer("aktivan", { mode: "boolean" }).notNull().default(true),
});

export const budzeti = sqliteTable(
  "budzeti",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    mesec: text("mesec").notNull(), // YYYY-MM
    kategorijaId: integer("kategorija_id")
      .notNull()
      .references(() => kategorije.id, { onDelete: "cascade" }),
    limitPara: integer("limit_para").notNull(),
  },
  (t) => [uniqueIndex("budzet_mesec_kategorija").on(t.mesec, t.kategorijaId)],
);
