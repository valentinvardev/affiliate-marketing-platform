import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const BASE   = process.env.TAPRAIN_SUITE_BASE ?? "https://taprain.com";
const COOKIE = process.env.TAPRAIN_SUITE_COOKIE ?? "";

/**
 * Proxy a las Ads Suite tools de TapRain (`/api/suite/*`).
 * La suite es session-authenticated (no usa X-Api-Key), así que reenviamos
 * la cookie de sesión guardada en env TAPRAIN_SUITE_COOKIE. Sin cookie → 503.
 */
async function forward(req: NextRequest, path: string[]) {
  if (!COOKIE) {
    return NextResponse.json(
      { error: "suite_not_connected", message: "Falta TAPRAIN_SUITE_COOKIE en el servidor." },
      { status: 503 },
    );
  }

  const url = `${BASE}/api/suite/${path.join("/")}${req.nextUrl.search}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      Cookie: COOKIE,
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
