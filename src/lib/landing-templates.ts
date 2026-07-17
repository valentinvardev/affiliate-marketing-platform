// Catálogo de plantillas de landing. `slug` se guarda en Campaign.templateSlug.
export type TemplateDef = { slug: string; name: string; description: string };

export const LANDING_TEMPLATES: TemplateDef[] = [
  { slug: "classic", name: "Clásica", description: "La original: Poppins, cascada de logos, colorida." },
  { slug: "freecash-v2", name: "FreeCash v2", description: "Fintech/SaaS: fondo oscuro premium, Space Grotesk, optimizada a conversión." },
];

export const DEFAULT_TEMPLATE = "classic";

// Marca fija de la plantilla FreeCash v2 (no usa el nombre de la campaña).
export const V2_BRAND = "FreeCash";

/** Mapea cualquier templateSlug legacy a uno del catálogo (default = clásica). */
export function resolveTemplate(slug?: string | null): string {
  return slug === "freecash-v2" ? "freecash-v2" : "classic";
}
