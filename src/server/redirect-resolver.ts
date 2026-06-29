import { db } from "@/server/db";

/** apex en minúsculas, sin puerto ni www */
export function normalizeHost(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let h = (raw.split(":")[0] ?? "").toLowerCase().trim();
  if (h.startsWith("www.")) h = h.slice(4);
  return h || null;
}

/**
 * Resuelve a dónde redirigir un dominio de cloaking según su config.
 * - cloakOn  → una whitepage al azar de la lista.
 * - cloakOff → la landing de la campaña (targetUrl).
 * Devuelve null si el host no es un dominio de redirección (o no hay destino).
 */
export async function resolveRedirect(rawHost: string | null | undefined): Promise<string | null> {
  const host = normalizeHost(rawHost);
  if (!host) return null;
  const r = await db.redirect.findUnique({ where: { domain: host } });
  if (!r) return null;
  if (r.cloakOn) {
    const pages = r.whitepages.map((p) => p.trim()).filter(Boolean);
    if (!pages.length) return null;
    return pages[Math.floor(Math.random() * pages.length)] ?? null;
  }
  return r.targetUrl?.trim() || null;
}
