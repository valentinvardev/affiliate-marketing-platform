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
 * Cache en memoria de los dominios de redirección. Evita pegarle a la DB en
 * CADA vista de landing legítima (freecash/teststar/…): sólo las landings de
 * un dominio de redirección hacen la query pesada. Se refresca cada 60s.
 */
let domainCache: { set: Set<string>; at: number } | null = null;
async function redirectDomains(): Promise<Set<string>> {
  if (domainCache && Date.now() - domainCache.at < 60_000) return domainCache.set;
  const rows = await db.redirectDomain.findMany({ select: { domain: true } });
  domainCache = { set: new Set(rows.map((r) => r.domain)), at: Date.now() };
  return domainCache.set;
}

/**
 * Resuelve a dónde redirigir un dominio/ruta de cloaking según su config.
 * - cloakOn  → una whitepage al azar de la lista.
 * - cloakOff → la landing de la campaña (targetUrl).
 * Devuelve null si el host no es de redirección, o no hay destino válido.
 */
export async function resolveRedirect(rawHost: string | null | undefined, rawPath: string | null | undefined): Promise<string | null> {
  const host = normalizeHost(rawHost);
  if (!host) return null;

  // La mayoría de las landings NO son de redirección → salimos sin tocar Redirect.
  const domains = await redirectDomains();
  if (!domains.has(host)) return null;

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

  // Guard anti-loop: sólo redirigir a una URL http(s) ABSOLUTA de OTRO host.
  let u: URL;
  try { u = new URL(target); } catch { return null; } // relativa → no redirigir (evita loop)
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (normalizeHost(u.host) === host) return null; // mismo host → loop
  return u.toString();
}
