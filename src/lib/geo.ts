import "server-only";

/**
 * País del visitante, para el filtro de geo de las landings.
 *
 * Orden de resolución:
 *  1. Header del CDN si existe (Cloudflare, CloudFront…). Instantáneo y sin
 *     límite de requests — es la fuente preferida.
 *  2. Lookup por IP contra ipwho.is, con caché en memoria por IP.
 *
 * Dos decisiones que importan más que la precisión:
 *
 *  - FALLA ABIERTO. Si el lookup falla, tarda de más o no hay IP, se deja pasar
 *    al visitante. Un corte del servicio de geo bloquearía TODO el tráfico y
 *    costaría muchísimo más que dejar entrar algunos clicks fuera de geo.
 *  - Timeout corto. Esto corre antes de renderizar la landing, y el tráfico de
 *    TikTok abandona rapidísimo: es preferible dejar pasar a demorar.
 */

const LOOKUP_TIMEOUT_MS = 1500;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 h
const CACHE_MAX = 20_000;

type Entry = { country: string | null; at: number };
const cache = new Map<string, Entry>();

/** Headers que ya traen el país resuelto por el CDN. */
const GEO_HEADERS = [
  "cf-ipcountry", // Cloudflare
  "cloudfront-viewer-country", // CloudFront
  "x-vercel-ip-country",
  "x-geo-country",
  "x-country-code",
];

function normalize(v: string | null | undefined): string | null {
  const s = v?.trim().toUpperCase();
  // "XX" es el valor de Cloudflare para desconocido; T1 es red Tor.
  if (!s || s.length !== 2 || s === "XX" || s === "T1") return null;
  return s;
}

/** Primera IP pública de x-forwarded-for. */
export function clientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    for (const raw of xff.split(",")) {
      const ip = raw.trim();
      if (ip && !isPrivate(ip)) return ip;
    }
  }
  const real = headers.get("x-real-ip")?.trim();
  return real && !isPrivate(real) ? real : null;
}

function isPrivate(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("172.17.") ||
    ip.startsWith("172.18.") ||
    ip.startsWith("172.19.") ||
    ip.startsWith("fc") ||
    ip.startsWith("fd")
  );
}

async function lookup(ip: string): Promise<string | null> {
  const hit = cache.get(ip);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.country;

  let country: string | null = null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), LOOKUP_TIMEOUT_MS);
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=country_code`, {
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (res.ok) {
      const j = (await res.json()) as { country_code?: string };
      country = normalize(j.country_code);
    }
  } catch {
    country = null; // se cachea igual, para no reintentar por cada request
  }

  if (cache.size >= CACHE_MAX) {
    // Purga simple: el Map mantiene orden de inserción, se van los más viejos.
    const drop = Math.ceil(CACHE_MAX * 0.2);
    let i = 0;
    for (const k of cache.keys()) {
      cache.delete(k);
      if (++i >= drop) break;
    }
  }
  cache.set(ip, { country, at: Date.now() });
  return country;
}

/** País ISO-2 del visitante, o null si no se pudo determinar. */
export async function visitorCountry(headers: Headers): Promise<string | null> {
  for (const h of GEO_HEADERS) {
    const c = normalize(headers.get(h));
    if (c) return c;
  }
  const ip = clientIp(headers);
  if (!ip) return null;
  return lookup(ip);
}

/**
 * ¿Se bloquea a este visitante?
 * Sólo cuando se pudo determinar el país Y no está en la lista permitida.
 * País desconocido = pasa (falla abierto).
 */
export function isBlocked(country: string | null, allowed: string[]): boolean {
  if (!country) return false;
  if (allowed.length === 0) return false;
  return !allowed.includes(country);
}
