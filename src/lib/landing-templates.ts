// Catálogo de plantillas de landing. `slug` se guarda en Campaign.templateSlug.
export type TemplateDef = { slug: string; name: string; description: string };

export const LANDING_TEMPLATES: TemplateDef[] = [
  { slug: "classic", name: "Clásica", description: "La original: Poppins, cascada de logos, colorida." },
  { slug: "freecash-v2", name: "FreeCash v2", description: "Fintech/SaaS: fondo oscuro premium, Space Grotesk, optimizada a conversión. Marca FreeCash." },
  { slug: "teststar-v2", name: "TestStar v2", description: "Misma base SaaS que FreeCash v2, con marca TestStar." },
];

export const DEFAULT_TEMPLATE = "classic";

// Marca fija por plantilla v2 (no usa el nombre de la campaña).
const V2_BRANDS: Record<string, string> = { "freecash-v2": "FreeCash", "teststar-v2": "TestStar" };

/** Mapea cualquier templateSlug legacy a uno del catálogo (default = clásica). */
export function resolveTemplate(slug?: string | null): string {
  if (slug === "freecash-v2" || slug === "teststar-v2") return slug;
  return "classic";
}

/** ¿Es una plantilla v2 (comparten el componente LanderV2)? */
export function isV2Template(slug?: string | null): boolean {
  return resolveTemplate(slug) !== "classic";
}

/** Marca fija de la plantilla v2 (null = clásica → usa el nombre de la campaña). */
export function brandFor(slug?: string | null): string | null {
  return V2_BRANDS[resolveTemplate(slug)] ?? null;
}
