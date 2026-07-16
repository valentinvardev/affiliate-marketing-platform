export type Currency = {
  code: string;
  symbol: string;
  label: string;
  locale: string; // BCP-47 locale for number formatting
  rate: number;   // 1 USD = `rate` de esta moneda (aprox., actualizable a mano)
};

// Tasas aproximadas respecto al USD (base). No hace falta que sean exactas: la landing
// solo necesita mostrar un monto local verosímil equivalente al payout en USD.
export const CURRENCIES: Currency[] = [
  { code: "GBP", symbol: "£",   label: "Libra esterlina (£)",     locale: "en-GB", rate: 0.79 },
  { code: "EUR", symbol: "€",   label: "Euro (€)",                locale: "es-ES", rate: 0.92 },
  { code: "USD", symbol: "$",   label: "Dólar (USD $)",           locale: "en-US", rate: 1 },
  { code: "SEK", symbol: "kr",  label: "Corona sueca (SEK kr)",   locale: "sv-SE", rate: 10.6 },
  { code: "DKK", symbol: "kr",  label: "Corona danesa (DKK kr)",  locale: "da-DK", rate: 6.9 },
  { code: "NOK", symbol: "kr",  label: "Corona noruega (NOK kr)", locale: "nb-NO", rate: 10.8 },
  { code: "CHF", symbol: "Fr",  label: "Franco suizo (CHF)",      locale: "de-CH", rate: 0.88 },
  { code: "PLN", symbol: "zł",  label: "Esloti polaco (PLN zł)",  locale: "pl-PL", rate: 4.0 },
  { code: "CZK", symbol: "Kč",  label: "Corona checa (CZK Kč)",   locale: "cs-CZ", rate: 23 },
  { code: "HUF", symbol: "Ft",  label: "Forinto húngaro (HUF Ft)",locale: "hu-HU", rate: 360 },
  { code: "RON", symbol: "lei", label: "Leu rumano (RON lei)",    locale: "ro-RO", rate: 4.6 },
  { code: "BGN", symbol: "лв",  label: "Lev búlgaro (BGN лв)",   locale: "bg-BG", rate: 1.8 },
  { code: "AUD", symbol: "A$",  label: "Dólar australiano (AUD)", locale: "en-AU", rate: 1.52 },
  { code: "CAD", symbol: "C$",  label: "Dólar canadiense (CAD)",  locale: "en-CA", rate: 1.37 },
  { code: "NZD", symbol: "NZ$", label: "Dólar neozelandés (NZD)", locale: "en-NZ", rate: 1.66 },
];

export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find((c) => c.code === code);
}

// Redondea a un número "lindo" según la magnitud (evita decimales raros en la landing).
function niceRound(v: number): number {
  if (v >= 1000) return Math.round(v / 10) * 10;
  if (v >= 5)    return Math.round(v);
  return Math.round(v * 2) / 2; // montos chicos: al 0.5 más cercano
}

/** Convierte un monto en USD a la moneda `code` y lo formatea localizado (ej. 17 USD → "179 kr"). */
export function formatMoneyFromUsd(amountUsd: number, code: string): string {
  const cur = getCurrencyByCode(code) ?? getCurrencyByCode("USD")!;
  const v = niceRound(amountUsd * cur.rate);
  try {
    return new Intl.NumberFormat(cur.locale, {
      style: "currency",
      currency: cur.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: Number.isInteger(v) ? 0 : 2,
    }).format(v);
  } catch {
    return `${cur.symbol}${v}`;
  }
}
