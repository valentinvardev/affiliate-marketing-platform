import { type NextRequest, NextResponse } from "next/server";
import { fetchOffers, type OffersParams } from "@/lib/taprain";
import { db } from "@/server/db";

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
    const [tapData, configs] = await Promise.all([
      fetchOffers(params),
      db.offerConfig.findMany({ select: { offerId: true, whitelisted: true, imageUrl: true } }),
    ]);

    const whitelisted = configs.filter(c => c.whitelisted).map(c => c.offerId);
    const configMap   = new Map(configs.map(c => [c.offerId, c]));

    // Merge custom image and whitelisted flag into each offer
    let offers = tapData.offers.map((o) => {
      const cfg = configMap.get(o.id);
      return {
        ...o,
        image_url:   cfg?.imageUrl ?? o.image_url,
        whitelisted: cfg?.whitelisted ?? false,
      };
    });

    // Filter to whitelisted only if any are configured; else return all
    if (whitelisted.length > 0) {
      offers = offers.filter(o => o.whitelisted);
    }

    return NextResponse.json({ ...tapData, offers, total: offers.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
