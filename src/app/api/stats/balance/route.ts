import { NextResponse } from "next/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);

  const [today, yesterday] = await Promise.all([
    db.conversion.aggregate({
      where: { receivedAt: { gte: startOfToday } },
      _sum: { price: true },
      _count: { id: true },
    }),
    db.conversion.aggregate({
      where: { receivedAt: { gte: startOfYesterday, lt: startOfToday } },
      _sum: { price: true },
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({
    today:     { revenue: today._sum.price ?? 0,     conversions: today._count.id },
    yesterday: { revenue: yesterday._sum.price ?? 0, conversions: yesterday._count.id },
  });
}
