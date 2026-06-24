import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

const BASE = process.env.TAPRAIN_SUITE_BASE ?? "https://taprain.com";
const SUITE_COOKIE_KEY = "taprain_suite_cookie";

async function getCookie(): Promise<string> {
  try {
    const row = await db.appConfig.findUnique({ where: { key: SUITE_COOKIE_KEY } });
    if (row?.value) return row.value;
  } catch { /* ignore */ }
  return process.env.TAPRAIN_SUITE_COOKIE ?? "";
}

/**
 * Proxy a las Ads Suite tools de TapRain (`/api/suite/*`).
 * La suite es session-authenticated: reenviamos la cookie de sesión guardada
 * en DB (AppConfig) — editable desde la app cuando expira, sin redeploy.
 */
async function forward(req: NextRequest, path: string[]) {
  const cookie = await getCookie();
  if (!cookie) {
    return NextResponse.json(
      { error: "suite_not_connected", message: "Pegá tu cookie de sesión de TapRain para conectar." },
      { status: 503 },
    );
  }

  const url = `${BASE}/api/suite/${path.join("/")}${req.nextUrl.search}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    cache: "no-store",
  };
  if (!["GET", "HEAD"].includes(req.method)) {
    init.body = await req.text();
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "fetch_failed", message: e instanceof Error ? e.message : "Error de red" },
      { status: 502 },
    );
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx)    { return forward(req, (await ctx.params).path); }
export async function POST(req: NextRequest, ctx: Ctx)   { return forward(req, (await ctx.params).path); }
export async function PATCH(req: NextRequest, ctx: Ctx)  { return forward(req, (await ctx.params).path); }
export async function DELETE(req: NextRequest, ctx: Ctx) { return forward(req, (await ctx.params).path); }
