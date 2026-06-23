export type AppLocale = {
  code: string;
  label: string;
  flag: string;
  defaultCurrencyCode: string;
};

export const LOCALES: AppLocale[] = [
  { code: "en", label: "English (UK)",   flag: "🇬🇧", defaultCurrencyCode: "GBP" },
  { code: "sv", label: "Svenska",        flag: "🇸🇪", defaultCurrencyCode: "SEK" },
  { code: "fr", label: "Français",       flag: "🇫🇷", defaultCurrencyCode: "EUR" },
  { code: "da", label: "Dansk",          flag: "🇩🇰", defaultCurrencyCode: "DKK" },
  { code: "no", label: "Norsk",          flag: "🇳🇴", defaultCurrencyCode: "NOK" },
  { code: "de", label: "Deutsch",        flag: "🇩🇪", defaultCurrencyCode: "EUR" },
  { code: "nl", label: "Nederlands",     flag: "🇳🇱", defaultCurrencyCode: "EUR" },
  { code: "fi", label: "Suomi",          flag: "🇫🇮", defaultCurrencyCode: "EUR" },
  { code: "pl", label: "Polski",         flag: "🇵🇱", defaultCurrencyCode: "PLN" },
  { code: "cs", label: "Čeština",        flag: "🇨🇿", defaultCurrencyCode: "CZK" },
  { code: "hu", label: "Magyar",         flag: "🇭🇺", defaultCurrencyCode: "HUF" },
  { code: "ro", label: "Română",         flag: "🇷🇴", defaultCurrencyCode: "RON" },
  { code: "pt", label: "Português (PT)", flag: "🇵🇹", defaultCurrencyCode: "EUR" },
  { code: "es", label: "Español",        flag: "🇪🇸", defaultCurrencyCode: "EUR" },
  { code: "it", label: "Italiano",       flag: "🇮🇹", defaultCurrencyCode: "EUR" },
  { code: "en-US", label: "English (US)",flag: "🇺🇸", defaultCurrencyCode: "USD" },
  { code: "en-AU", label: "English (AU)",flag: "🇦🇺", defaultCurrencyCode: "AUD" },
  { code: "en-CA", label: "English (CA)",flag: "🇨🇦", defaultCurrencyCode: "CAD" },
  { code: "en-NZ", label: "English (NZ)",flag: "🇳🇿", defaultCurrencyCode: "NZD" },
];

export function getLocaleByCode(code: string): AppLocale | undefined {
  return LOCALES.find((l) => l.code === code);
}
