export type Currency = {
  code: string;
  symbol: string;
  label: string;
  locale: string; // BCP-47 locale for number formatting
};

export const CURRENCIES: Currency[] = [
  { code: "GBP", symbol: "£",   label: "Libra esterlina (£)",     locale: "en-GB" },
  { code: "EUR", symbol: "€",   label: "Euro (€)",                locale: "es-ES" },
  { code: "USD", symbol: "$",   label: "Dólar (USD $)",           locale: "en-US" },
  { code: "SEK", symbol: "kr",  label: "Corona sueca (SEK kr)",   locale: "sv-SE" },
  { code: "DKK", symbol: "kr",  label: "Corona danesa (DKK kr)",  locale: "da-DK" },
  { code: "NOK", symbol: "kr",  label: "Corona noruega (NOK kr)", locale: "nb-NO" },
  { code: "CHF", symbol: "Fr",  label: "Franco suizo (CHF)",      locale: "de-CH" },
  { code: "PLN", symbol: "zł",  label: "Esloti polaco (PLN zł)",  locale: "pl-PL" },
  { code: "CZK", symbol: "Kč",  label: "Corona checa (CZK Kč)",   locale: "cs-CZ" },
  { code: "HUF", symbol: "Ft",  label: "Forinto húngaro (HUF Ft)",locale: "hu-HU" },
  { code: "RON", symbol: "lei", label: "Leu rumano (RON lei)",    locale: "ro-RO" },
  { code: "BGN", symbol: "лв",  label: "Lev búlgaro (BGN лв)",   locale: "bg-BG" },
  { code: "AUD", symbol: "A$",  label: "Dólar australiano (AUD)", locale: "en-AU" },
  { code: "CAD", symbol: "C$",  label: "Dólar canadiense (CAD)",  locale: "en-CA" },
  { code: "NZD", symbol: "NZ$", label: "Dólar neozelandés (NZD)", locale: "en-NZ" },
];

export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find((c) => c.code === code);
}
