/**
 * Rate limiter en memoria (ventana fija). Suficiente para un solo proceso pm2
 * (fork). Si algún día se escala a cluster/varias instancias, mover a Redis/DB.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();

  // prune ocasional para que el Map no crezca infinito
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  b.count++;
  if (b.count > max) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Mejor esfuerzo para sacar la IP del cliente detrás de nginx. */
export function clientIp(headers: Headers | Record<string, string | string[] | undefined> | undefined): string {
  if (!headers) return "unknown";
  const get = (name: string): string | undefined => {
    if (typeof (headers as Headers).get === "function") return (headers as Headers).get(name) ?? undefined;
    const v = (headers as Record<string, string | string[] | undefined>)[name];
    return Array.isArray(v) ? v[0] : v;
  };
  const xri = get("x-real-ip");
  if (xri) return xri.trim();
  const xff = get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return "unknown";
}
