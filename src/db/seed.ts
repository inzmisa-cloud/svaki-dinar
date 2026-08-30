import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { kategorije, racuni } from "./schema";

type Db = BetterSQLite3Database<{
  racuni: typeof racuni;
  kategorije: typeof kategorije;
}>;

const KATEGORIJE_PRIHOD: Array<{ naziv: string; boja: string }> = [
  { naziv: "Plata", boja: "#16a34a" },
  { naziv: "Honorar", boja: "#22c55e" },
  { naziv: "Poklon", boja: "#84cc16" },
  { naziv: "Ostali prihodi", boja: "#4ade80" },
];

const KATEGORIJE_RASHOD: Array<{ naziv: string; boja: string }> = [
  { naziv: "Hrana", boja: "#ef4444" },
  { naziv: "Stanovanje", boja: "#f97316" },
  { naziv: "Režije", boja: "#eab308" },
  { naziv: "Transport", boja: "#0ea5e9" },
  { naziv: "Rate kredita", boja: "#dc2626" },
  { naziv: "Zdravlje", boja: "#ec4899" },
  { naziv: "Odeća", boja: "#8b5cf6" },
  { naziv: "Zabava", boja: "#a855f7" },
  { naziv: "Ostali rashodi", boja: "#64748b" },
];

export function ensureSeed(db: Db): void {
  const postojiRacun = db.select().from(racuni).limit(1).all();
  if (postojiRacun.length === 0) {
    db.insert(racuni)
      .values([
        { naziv: "Gotovina", tip: "kes", pocetnoStanjePara: 0 },
        { naziv: "Tekući račun", tip: "tekuci", pocetnoStanjePara: 0 },
      ])
      .run();
  }

  const postojeKategorije = db.select().from(kategorije).limit(1).all();
  if (postojeKategorije.length === 0) {
    db.insert(kategorije)
      .values([
        ...KATEGORIJE_PRIHOD.map((k) => ({ ...k, tip: "prihod" })),
        ...KATEGORIJE_RASHOD.map((k) => ({ ...k, tip: "rashod" })),
      ])
      .run();
  }
}
