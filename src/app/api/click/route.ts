import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

/** Registra un click al CTA (s1 = slug de campaña) y redirige a la oferta (`to`). */
export async function GET(req: NextRequest) {
  const s1 = req.nextUrl.searchParams.get("s1");
  const to = req.nextUrl.searchParams.get("to");

  const dest = (() => {
    if (to) {
      try { const u = new URL(to); if (u.protocol === "http:" || u.protocol === "https:") return u.toString(); } catch { /* inválido */ }
    }
    return new URL("/", req.url).toString();
  })();

  if (s1) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    try {
      // Dedupe: un mismo IP+campaña cuenta como 1 click dentro de una ventana
      // (evita inflar por refresh, prefetch de navegadores in-app y re-clicks).
      const DEDUP_MS = 6 * 60 * 60 * 1000; // 6 h
      const recent = ip
        ? await db.click.findFirst({ where: { s1, ip, createdAt: { gte: new Date(Date.now() - DEDUP_MS) } }, select: { id: true } })
        : null;
      if (!recent) await db.click.create({ data: { s1, ip } });
    } catch { /* best-effort */ }
  }

  return NextResponse.redirect(dest, 302);
}
