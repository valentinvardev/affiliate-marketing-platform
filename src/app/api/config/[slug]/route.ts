import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { formatMoneyFromUsd } from "@/lib/currencies";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const campaign = await db.campaign.findUnique({
    where: { slug },
    include: {
      offers: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!campaign?.isActive) {
    return NextResponse.json({ error: "not found" }, { status: 404, headers: CORS });
  }

  return NextResponse.json(
    {
      id:            campaign.id,
      slug:          campaign.slug,
      templateSlug:  campaign.templateSlug,
      locale:        campaign.locale,
      currencySymbol: campaign.currencySymbol,
      currencyCode:  campaign.currencyCode,
      ctaUrl:        campaign.ctaUrl,
      logoUrl:       campaign.logoUrl,
      colorPrimary:  campaign.colorPrimary,
      colorBg:       campaign.colorBg,
      offers: campaign.offers.map((o) => ({
        id:          o.id,
        name:        o.name,
        imageUrl:    o.imageUrl,
        tag:         o.tag,
        badge:       o.badge,
        amount:      o.amount, // USD (base)
        amountLabel: formatMoneyFromUsd(o.amount, campaign.currencyCode), // convertido + formateado (ej. "179 kr")
        rating:      o.rating,
        note:        o.note,
      })),
    },
    { headers: CORS },
  );
}
