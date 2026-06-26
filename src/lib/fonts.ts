// Fuentes soportadas para las landings (Google Fonts). El admin elige por oferta
// la de títulos y la de párrafos; la campaña las hereda y el lander las carga.
export const LANDING_FONTS = [
  "Inter",
  "Manrope",
  "Poppins",
  "Montserrat",
  "Roboto",
  "Outfit",
  "Sora",
  "Plus Jakarta Sans",
  "DM Sans",
  "Nunito",
  "Rubik",
  "Lexend",
  "Work Sans",
  "Space Grotesk",
] as const;

export const DEFAULT_FONT = "Inter";

export function normalizeFont(f?: string | null): string {
  return f && (LANDING_FONTS as readonly string[]).includes(f) ? f : DEFAULT_FONT;
}

/** URL de Google Fonts css2 para las familias dadas (deduplicadas). */
export function googleFontsHref(families: string[]): string {
  const uniq = [...new Set(families.map(normalizeFont))];
  const params = uniq
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800;900`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/** font-family CSS con fallbacks. */
export function fontStack(f?: string | null): string {
  return `'${normalizeFont(f)}', system-ui, -apple-system, sans-serif`;
}
