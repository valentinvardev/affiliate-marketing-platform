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
export async function fetchIproyalProxies(token?: string): Promise<{ ok: boolean; proxies: ProxyRow[]; error?: string }> {
  const t = token ?? (await getIproyalToken());
  if (!t) return { ok: false, proxies: [], error: "Falta el token de IPRoyal (Admin → Proxies)" };

  const list = await iproyalFetch("/orders", t);
  if (!list.ok) return { ok: false, proxies: [], error: `IPRoyal /orders devolvió ${list.status}` };

  const orders = (pick(list.data, ["data"]) as Record<string, unknown>[]) ?? [];
  const out: ProxyRow[] = [];

  for (const ord of orders) {
    const orderId = String(pick(ord, ["id"]) ?? "");
    if (!orderId) continue;
    const status = String(pick(ord, ["status"]) ?? "");
    if (/expire|cancel|refund/i.test(status)) continue;
    const label = (pick(ord, ["product_name", "productName", "product"]) as string) ?? null;
    const expRaw = pick(ord, ["expire_date", "expireDate", "expires_at"]);
    const expiresAt = expRaw ? new Date(expRaw as string) : null;

    const det = await iproyalFetch(`/orders/${orderId}`, t);
    const od = obj(pick(det.data, ["data"]) ?? det.data);
    const pd = obj(pick(od, ["proxy_data", "proxyData"]));
    const ports = obj(pick(pd, ["ports"]));
    const httpPort = Number(pick(ports, ["http", "https", "http|https"]) ?? pick(pd, ["http_port"]) ?? 0) || 0;
    const socksPort = Number(pick(ports, ["socks5", "socks"]) ?? 0) || null;
    const country = (pick(od, ["country", "country_code"]) as string) ?? null;
    const proxies = (pick(pd, ["proxies"]) as unknown[]) ?? [];

    // credenciales a nivel orden (fallback si no vienen por proxy)
    const ordUser = String(pick(pd, ["username", "user"]) ?? pick(od, ["username", "user"]) ?? "");
    const ordPass = String(pick(pd, ["password", "pass"]) ?? pick(od, ["password", "pass"]) ?? "");

    for (const p of proxies) {
      let host = "", username = "", password = "", hp = httpPort, sp = socksPort;
      if (typeof p === "string") {
        // formato "ip:httpPort:user:pass" o solo "ip"
        const parts = p.split(":");
        host = parts[0] ?? "";
        if (parts[1]) hp = Number(parts[1]) || httpPort;
        if (parts[2]) username = parts[2];
        if (parts[3]) password = parts[3];
      } else {
        const po = obj(p);
        host = String(pick(po, ["ip", "host", "address", "proxy"]) ?? "");
        username = String(pick(po, ["username", "user", "login"]) ?? "");
        password = String(pick(po, ["password", "pass"]) ?? "");
        hp = Number(pick(po, ["http_port", "port"]) ?? httpPort) || httpPort;
        sp = Number(pick(po, ["socks_port", "socks5_port"]) ?? socksPort ?? 0) || socksPort;
      }
      if (!host) continue;
      if (!username) username = ordUser;
      if (!password) password = ordPass;
      out.push({ externalId: `${orderId}:${host}`, host, httpPort: hp, socksPort: sp, username, password, label, country, orderId, expiresAt });
    }
  }

  return { ok: true, proxies: out };
}
