import type { LanderLocale } from "@/lib/lander-i18n";

export type AgeCopy = { question: string; yes: string; no: string };

/** Copy de la pregunta de edad (+21 / -21) por idioma de la landing. */
export const AGE_COPY: Record<LanderLocale, AgeCopy> = {
  en: { question: "Are you over 21 years old?", yes: "Yes, I'm 21+", no: "No, I'm under 21" },
  sv: { question: "Är du över 21 år?", yes: "Ja, jag är 21+", no: "Nej, jag är under 21" },
  fr: { question: "Avez-vous plus de 21 ans ?", yes: "Oui, j'ai 21 ans ou plus", no: "Non, j'ai moins de 21 ans" },
  de: { question: "Bist du über 21 Jahre alt?", yes: "Ja, ich bin 21+", no: "Nein, ich bin unter 21" },
  nl: { question: "Ben je ouder dan 21 jaar?", yes: "Ja, ik ben 21+", no: "Nee, ik ben jonger dan 21" },
  no: { question: "Er du over 21 år?", yes: "Ja, jeg er 21+", no: "Nei, jeg er under 21" },
  fi: { question: "Oletko yli 21-vuotias?", yes: "Kyllä, olen 21+", no: "En, olen alle 21" },
  pl: { question: "Czy masz ukończone 21 lat?", yes: "Tak, mam 21+", no: "Nie, mam mniej niż 21" },
  it: { question: "Hai più di 21 anni?", yes: "Sì, ho 21 anni o più", no: "No, ho meno di 21 anni" },
};

export function getAgeCopy(locale: LanderLocale): AgeCopy {
  return AGE_COPY[locale] ?? AGE_COPY.en;
}
