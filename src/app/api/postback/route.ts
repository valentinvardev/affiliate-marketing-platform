import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// TapRain fires this URL on every conversion via Global Postback.
// Configure in TapRain dashboard → Global Postback:
// https://your-domain.vercel.app/api/postback?price={price}&offer_name={offer_name}&country={country}&s1={s1}&s2={s2}&click_id={click_id}&conversion_id={conversion_id}&ip={ip}
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const priceRaw = p.get("price") ?? p.get("payout") ?? "0";
  const price = parseFloat(priceRaw);

  if (isNaN(price) || price < 0) {
    return NextResponse.json({ message: "invalid price" }, { status: 400 });
  }

  await db.conversion.create({
    data: {
      price,
      offerName:    p.get("offer_name") ?? p.get("offer") ?? null,
      country:      p.get("country") ?? null,
      s1:           p.get("s1") ?? null,
      s2:           p.get("s2") ?? null,
      clickId:      p.get("click_id") ?? null,
      conversionId: p.get("conversion_id") ?? null,
      ip:           p.get("ip") ?? req.headers.get("x-forwarded-for") ?? null,
    },
  });

  return NextResponse.json({ message: "ok" });
}

// Some networks fire POST instead of GET
export async function POST(req: NextRequest) {
  return GET(req);
}
