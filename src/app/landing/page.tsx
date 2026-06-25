import { db } from "@/server/db";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Lander } from "@/components/landing/lander";
import { getDict, type LanderLocale } from "@/lib/lander-i18n";

export const dynamic = "force-dynamic";

/** apex en minúsculas, sin puerto ni www */
function normalizeHost(raw: string | null): string | null {
  if (!raw) return null;
  let host = (raw.split(":")[0] ?? "").toLowerCase();
  if (host.startsWith("www.")) host = host.slice(4);
  return host || null;
}

/**
 * Resuelve la campaña según el dominio custom (header Host).
 * El middleware reescribe los hosts que no son el panel ni un subdominio de
 * tapsur.com hacia esta ruta; acá miramos el Host y buscamos el LandingDomain.
 */
async function campaignForHost() {
  const host = normalizeHost((await headers()).get("host"));
  if (!host) return null;
  const map = await db.landingDomain.findUnique({
    where: { domain: host },
    include: { campaign: { include: { offers: { orderBy: { position: "asc" } } } } },
  });
  return map?.campaign ?? null;
}

export async function generateMetadata(): Promise<Metadata> {
  const campaign = await campaignForHost();
  if (!campaign) return {};
  const t = getDict((campaign.locale as LanderLocale) ?? "en");
  return { title: t.meta.title, description: t.meta.description };
}

export default async function LandingByHostPage() {
  const campaign = await campaignForHost();
  if (!campaign?.isActive) notFound();
  return <Lander campaign={campaign} />;
}
