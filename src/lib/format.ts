export const MESECI_SR = [
  "Januar",
  "Februar",
  "Mart",
  "April",
  "Maj",
  "Jun",
  "Jul",
  "Avgust",
  "Septembar",
  "Oktobar",
  "Novembar",
  "Decembar",
];

/** Formatira iznos u parama (1 RSD = 100 para) kao "1.234,56 RSD". */
export function formatRSD(para: number): string {
  return new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency: "RSD",
  }).format(para / 100);
}

/** Kratki format bez "RSD" sufiksa — za kartice i grafikone. */
export function formatBroj(para: number): string {
  return new Intl.NumberFormat("sr-RS", {
    maximumFractionDigits: 2,
  }).format(para / 100);
}

/**
 * Pretvara unos korisnika ("1.234,56" ili "1234.56") u cele pare.
 * Vraća NaN ako unos nije validan pozitivan broj.
 */
export function toPara(unos: string): number {
  let s = unos.trim();
  if (!s) return NaN;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const broj = Number(s);
  if (!Number.isFinite(broj)) return NaN;
  return Math.round(broj * 100);
}

/** Današnji datum u lokalnoj zoni kao YYYY-MM-DD. */
export function danas(): string {
  return datumISO(new Date());
}

export function datumISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function tekuciMesec(): string {
  return danas().slice(0, 7);
}

/** YYYY-MM-DD → DD-MM-YYYY. */
export function formatDatum(iso: string): string {
  const [g, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}-${g}`;
}

/**
 * Prihvata "DD-MM-YYYY" ili "YYYY-MM-DD" i vraća ISO "YYYY-MM-DD",
 * ili null ako datum nije ispravan.
 */
export function parseDatum(unos: string): string | null {
  const s = unos.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  const eu = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  let g: number, m: number, d: number;
  if (iso) {
    [, g, m, d] = iso.map(Number) as unknown as [number, number, number, number];
  } else if (eu) {
    [, d, m, g] = eu.map(Number) as unknown as [number, number, number, number];
  } else {
    return null;
  }
  const provera = new Date(g, m - 1, d);
  if (
    provera.getFullYear() !== g ||
    provera.getMonth() !== m - 1 ||
    provera.getDate() !== d
  ) {
    return null;
  }
  return `${g}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** YYYY-MM → "Avgust 2026." */
export function formatMesec(mesec: string): string {
  const [g, m] = mesec.split("-").map(Number);
  return `${MESECI_SR[m - 1]} ${g}.`;
}

/** Sledeći mesec za YYYY-MM. */
export function sledeciMesec(mesec: string): string {
  const [g, m] = mesec.split("-").map(Number);
  return m === 12 ? `${g + 1}-01` : `${g}-${String(m + 1).padStart(2, "0")}`;
}

/** Prethodni mesec za YYYY-MM. */
export function prethodniMesec(mesec: string): string {
  const [g, m] = mesec.split("-").map(Number);
  return m === 1 ? `${g - 1}-12` : `${g}-${String(m - 1).padStart(2, "0")}`;
}

/** Poslednjih n meseci (stariji → noviji), uključujući tekući. */
export function poslednjihNMeseci(n: number, odMeseca = tekuciMesec()): string[] {
  let m = odMeseca;
  const lista: string[] = [];
  for (let i = 0; i < n; i++) {
    lista.unshift(m);
    m = prethodniMesec(m);
  }
  return lista;
}
