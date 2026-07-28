// Catálogo de plantillas de landing. `slug` se guarda en Campaign.templateSlug.
export type TemplateDef = { slug: string; name: string; description: string };

export const LANDING_TEMPLATES: TemplateDef[] = [
  { slug: "classic", name: "Clásica", description: "La original: Poppins, cascada de logos, colorida." },
  { slug: "freecash-v2", name: "FreeCash v2", description: "Fintech/SaaS: fondo oscuro premium, Space Grotesk, optimizada a conversión. Marca FreeCash." },
  { slug: "teststar-v2", name: "TestStar v2", description: "Misma base SaaS que FreeCash v2, con marca TestStar." },
  { slug: "testerup-v2", name: "TesterUp v2", description: "Misma base SaaS que FreeCash v2, con marca TesterUp." },
  { slug: "quest", name: "Quest (por pasos)", description: "Embudo GPTP en 3 etapas: elegir juego → cómo te pagan → descargar. Base indigo, oro para la recompensa, Chakra Petch. Mobile-first para tráfico de TikTok." },
];

export const DEFAULT_TEMPLATE = "classic";

// Marca fija por plantilla v2 (no usa el nombre de la campaña).
const V2_BRANDS: Record<string, string> = {
  "freecash-v2": "FreeCash",
  "teststar-v2": "TestStar",
  "testerup-v2": "TesterUp",
};

const QUEST = "quest";

/** Mapea cualquier templateSlug legacy a uno del catálogo (default = clásica). */
export function resolveTemplate(slug?: string | null): string {
  if (slug && (slug in V2_BRANDS || slug === QUEST)) return slug;
  return "classic";
}

/** ¿Comparte el componente LanderV2? */
export function isV2Template(slug?: string | null): boolean {
  return resolveTemplate(slug) in V2_BRANDS;
}

/** ¿Es la plantilla Quest (embudo por etapas)? */
export function isQuestTemplate(slug?: string | null): boolean {
  return resolveTemplate(slug) === QUEST;
}

/** Plantillas oscuras → el gate de intro usa la variante "v2" en vez de la clásica. */
export function usesDarkGate(slug?: string | null): boolean {
  return isV2Template(slug) || isQuestTemplate(slug);
}

/** Marca fija de la plantilla v2 (null = usa el nombre de la campaña). */
export function brandFor(slug?: string | null): string | null {
  return V2_BRANDS[resolveTemplate(slug)] ?? null;
}
