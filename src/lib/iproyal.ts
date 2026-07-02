import { db } from "@/server/db";

const BASE = "https://apid.iproyal.com/v1/reseller";
const TOKEN_KEY = "iproyal_token";

export async function getIproyalToken(): Promise<string> {
  try { const r = await db.appConfig.findUnique({ where: { key: TOKEN_KEY } }); if (r?.value) return r.value; } catch { /* ignore */ }
  return process.env.IPROYAL_API_TOKEN ?? "";
}

export async function iproyalFetch(path: string, token: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Access-Token": token, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(text) as Record<string, unknown>; } catch { /* non-json */ }
  return { ok: res.ok, status: res.status, data };
}

/** Toma la primera clave presente (parsing defensivo ante variantes del shape). */
function pick(o: Record<string, unknown> | undefined, keys: string[]): unknown {
  if (!o) return undefined;
  for (const k of keys) if (o[k] != null) return o[k];
  return undefined;
}
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

export type ProxyRow = {
  externalId: string; host: string; httpPort: number; socksPort: number | null;
  username: string; password: string; label: string | null; country: string | null;
  orderId: string | null; expiresAt: Date | null;
};

/** Trae órdenes → proxies desde IPRoyal, normalizados y listos para upsert. */
const DEAD_STATUS = /refund|expire|cancel|fail|pending/i;

export async function fetchIproyalProxies(token?: string): Promise<{ ok: boolean; proxies: ProxyRow[]; error?: string }> {
  const t = token ?? (await getIproyalToken());
  if (!t) return { ok: false, proxies: [], error: "Falta el token de IPRoyal (Admin → Proxies)" };

  // 1) Productos (GET /orders exige product_id).
  const prod = await iproyalFetch("/products", t);
  if (!prod.ok) return { ok: false, proxies: [], error: `IPRoyal /products ${prod.status}: ${JSON.stringify(prod.data).slice(0, 300)}` };
  const products = (pick(prod.data, ["data"]) as Record<string, unknown>[]) ?? [];
  const productIds = products.map((p) => pick(p, ["id"])).filter((x) => x != null);

  const out: ProxyRow[] = [];
  const now = Date.now();

  // 2) Órdenes por producto (la lista ya trae proxy_data inline).
  for (const pid of productIds) {
    let page = 1, lastPage = 1;
    do {
      const list = await iproyalFetch(`/orders?product_id=${pid}&page=${page}&per_page=100`, t);
      if (!list.ok) break;
      const orders = (pick(list.data, ["data"]) as Record<string, unknown>[]) ?? [];
      lastPage = Number(pick(obj(pick(list.data, ["meta"])), ["last_page"]) ?? 1) || 1;

      for (const ord of orders) {
        const status = String(pick(ord, ["status"]) ?? "");
        if (DEAD_STATUS.test(status)) continue;
        const orderId = String(pick(ord, ["id"]) ?? "");
        const expRaw = pick(ord, ["expire_date", "expireDate"]);
        const expiresAt = expRaw ? new Date(String(expRaw).replace(" ", "T") + "Z") : null;
        if (expiresAt && expiresAt.getTime() < now) continue; // vencida

        const label = [pick(ord, ["product_name"]), pick(ord, ["plan_name"])].filter(Boolean).join(" · ") || null;
        const country = (pick(ord, ["location", "locations"]) as string) ?? null;
        const pd = obj(pick(ord, ["proxy_data", "proxyData"]));
        const ports = obj(pick(pd, ["ports"]));
        const httpPort = Number(pick(ports, ["http|https", "http", "https"]) ?? 0) || 0;
        const socksPort = Number(pick(ports, ["socks5", "socks"]) ?? 0) || null;
        const proxies = (pick(pd, ["proxies"]) as Record<string, unknown>[]) ?? [];

        for (const p of proxies) {
          const host = String(pick(p, ["ip", "host", "address"]) ?? "");
          if (!host) continue;
          out.push({
            externalId: `${orderId}:${host}`,
            host, httpPort, socksPort,
            username: String(pick(p, ["username", "user"]) ?? ""),
            password: String(pick(p, ["password", "pass"]) ?? ""),
            label, country, orderId, expiresAt,
          });
        }
      }
      page++;
    } while (page <= lastPage);
  }

  return { ok: true, proxies: out };
}
