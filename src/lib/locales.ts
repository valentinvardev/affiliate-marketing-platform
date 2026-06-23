export type AppLocale = {
  code: string;
  label: string;
  flag: string;
  countryCode: string;
  defaultCurrencyCode: string;
};

export const LOCALES: AppLocale[] = [
  { code: "en",    label: "English (UK)",   flag: "🇬🇧", countryCode: "GB", defaultCurrencyCode: "GBP" },
  { code: "sv",    label: "Svenska",        flag: "🇸🇪", countryCode: "SE", defaultCurrencyCode: "SEK" },
  { code: "fr",    label: "Français",       flag: "🇫🇷", countryCode: "FR", defaultCurrencyCode: "EUR" },
  { code: "da",    label: "Dansk",          flag: "🇩🇰", countryCode: "DK", defaultCurrencyCode: "DKK" },
  { code: "no",    label: "Norsk",          flag: "🇳🇴", countryCode: "NO", defaultCurrencyCode: "NOK" },
  { code: "de",    label: "Deutsch",        flag: "🇩🇪", countryCode: "DE", defaultCurrencyCode: "EUR" },
  { code: "nl",    label: "Nederlands",     flag: "🇳🇱", countryCode: "NL", defaultCurrencyCode: "EUR" },
  { code: "fi",    label: "Suomi",          flag: "🇫🇮", countryCode: "FI", defaultCurrencyCode: "EUR" },
  { code: "pl",    label: "Polski",         flag: "🇵🇱", countryCode: "PL", defaultCurrencyCode: "PLN" },
  { code: "cs",    label: "Čeština",        flag: "🇨🇿", countryCode: "CZ", defaultCurrencyCode: "CZK" },
  { code: "hu",    label: "Magyar",         flag: "🇭🇺", countryCode: "HU", defaultCurrencyCode: "HUF" },
  { code: "ro",    label: "Română",         flag: "🇷🇴", countryCode: "RO", defaultCurrencyCode: "RON" },
  { code: "pt",    label: "Português (PT)", flag: "🇵🇹", countryCode: "PT", defaultCurrencyCode: "EUR" },
  { code: "es",    label: "Español",        flag: "🇪🇸", countryCode: "ES", defaultCurrencyCode: "EUR" },
  { code: "it",    label: "Italiano",       flag: "🇮🇹", countryCode: "IT", defaultCurrencyCode: "EUR" },
  { code: "en-US", label: "English (US)",   flag: "🇺🇸", countryCode: "US", defaultCurrencyCode: "USD" },
  { code: "en-AU", label: "English (AU)",   flag: "🇦🇺", countryCode: "AU", defaultCurrencyCode: "AUD" },
  { code: "en-CA", label: "English (CA)",   flag: "🇨🇦", countryCode: "CA", defaultCurrencyCode: "CAD" },
  { code: "en-NZ", label: "English (NZ)",   flag: "🇳🇿", countryCode: "NZ", defaultCurrencyCode: "NZD" },
];

export function getLocaleByCode(code: string): AppLocale | undefined {
  return LOCALES.find((l) => l.code === code);
}
