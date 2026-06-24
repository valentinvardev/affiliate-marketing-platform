import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const BASE = process.env.TAPRAIN_SUITE_BASE ?? "https://taprain.com";
const KEY  = process.env.TAPRAIN_API_KEY ?? "";

/**
 * Proxy a las Ads Suite tools de TapRain (`/api/suite/*`).
 * Auth con la API key de TapRain (X-Api-Key). Sin key → 503.
 */
async function forward(req: NextRequest, path: string[]) {
  if (!KEY) {
    return NextResponse.json(
      { error: "suite_not_connected", message: "Falta TAPRAIN_API_KEY en el servidor." },
      { status: 503 },
    );
  }

  const url = `${BASE}/api/suite/${path.join("/")}${req.nextUrl.search}`;
  const init: RequestInit = {
    method: req.method,
    headers: {
      "X-Api-Key": KEY,
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
