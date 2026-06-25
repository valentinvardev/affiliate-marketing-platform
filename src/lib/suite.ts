import { db } from "@/server/db";

const BASE = process.env.TAPRAIN_SUITE_BASE ?? "https://taprain.com";
const SUITE_COOKIE_KEY = "taprain_suite_cookie";

export async function getSuiteCookie(): Promise<string> {
  try {
    const row = await db.appConfig.findUnique({ where: { key: SUITE_COOKIE_KEY } });
    if (row?.value) return row.value;
  } catch { /* ignore */ }
  return process.env.TAPRAIN_SUITE_COOKIE ?? "";
}

/** Llama a la Ads Suite de TapRain con la cookie de sesión guardada. */
export async function suiteFetch(path: string, init?: RequestInit) {
  const cookie = await getSuiteCookie();
  if (!cookie) return { ok: false, status: 503, data: {} as Record<string, unknown> };

  const res = await fetch(`${BASE}/api/suite/${path}`, {
    ...init,
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(text) as Record<string, unknown>; } catch { /* non-json */ }
  return { ok: res.ok, status: res.status, data };
}
