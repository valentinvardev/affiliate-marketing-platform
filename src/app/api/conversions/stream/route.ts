import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";
import { getScope, convWhere } from "@/lib/scope";

export const dynamic = "force-dynamic";

// Long-poll: returns latest conversion since the given timestamp (scopeada por usuario)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = req.nextUrl.searchParams.get("since");
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 5000);

  const { slugs } = await getScope();

  const conversion = await db.conversion.findFirst({
    where:   { ...convWhere(slugs), receivedAt: { gt: sinceDate } },
    orderBy: { receivedAt: "desc" },
    select:  { id: true, price: true, offerName: true, country: true, receivedAt: true },
  });

  return NextResponse.json({ conversion });
}
