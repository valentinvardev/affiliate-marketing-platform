import { type NextRequest, NextResponse } from "next/server";
import { fetchOffers, type OffersParams } from "@/lib/taprain";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const params: OffersParams = {
    search:             p.get("search")             ?? undefined,
    countries:          p.get("countries")          ?? undefined,
    devices:            p.get("devices")            ?? undefined,
    type:               p.get("type")               ?? undefined,
    domain:             p.get("domain")             ?? undefined,
    include_api_offers: p.get("include_api_offers") ?? undefined,
    limit:  p.has("limit")  ? Number(p.get("limit"))  : 50,
    offset: p.has("offset") ? Number(p.get("offset")) : 0,
  };

  try {
    const data = await fetchOffers(params);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
