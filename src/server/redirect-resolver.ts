import { db } from "@/server/db";

/** apex en minúsculas, sin puerto ni www */
export function normalizeHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let h = (raw.split(":")[0] ?? "").toLowerCase().trim();
  if (h.startsWith("www.")) h = h.slice(4);
  return h || null;
}

/** ruta tras el dominio: sin barras al borde, en minúsculas ("" = raíz). */
export function normalizePath(raw: string | null | undefined): string {
  return (raw ?? "").trim().replace(/^\/+|\/+$/g, "").toLowerCase();
}

/** Safe pages de ejemplo (tiendas de ropa medianamente conocidas). */
export const DEFAULT_SAFE_PAGES = [
  "https://www.zara.com",
  "https://www.mango.com",
  "https://www.cos.com",
  "https://www.massimodutti.com",
  "https://www.uniqlo.com",
  "https://www.everlane.com",
];

/**
 * Resuelve a dónde redirigir un dominio/ruta de cloaking según su config.
 * - cloakOn  → una whitepage al azar de la lista.
 * - cloakOff → la landing de la campaña (targetUrl).
 * Devuelve null si no hay redirector para ese dominio/ruta (o no hay destino).
 */
export async function resolveRedirect(rawHost: string | null | undefined, rawPath: string | null | undefined): Promise<string | null> {
  const host = normalizeHost(rawHost);
  if (!host) return null;
  const path = normalizePath(rawPath);
  const r = await db.redirect.findUnique({ where: { domain_path: { domain: host, path } } });
  if (!r) return null;

  let target: string | null;
  if (r.cloakOn) {
    const pages = r.whitepages.map((p) => p.trim()).filter(Boolean);
    target = pages.length ? (pages[Math.floor(Math.random() * pages.length)] ?? null) : null;
  } else {
    target = r.targetUrl?.trim() || null;
  }
  if (!target) return null;

  // Guard anti-loop: nunca redirigir a su propio host.
  try { if (normalizeHost(new URL(target).host) === host) return null; } catch { /* relativo: lo dejamos pasar */ }
  return target;
}
