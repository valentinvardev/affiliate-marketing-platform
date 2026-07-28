import { db } from "@/server/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { LanderByTemplate } from "@/components/landing/lander-switch";
import { LanderGate } from "@/components/landing/lander-gate";
import { usesDarkGate, brandFor } from "@/lib/landing-templates";
import { pickWhitepage } from "@/lib/whitepages";
import { getDict, resolveLocale } from "@/lib/lander-i18n";
import { getAgeCopy } from "@/lib/age-gate-i18n";
import { AgeGate } from "@/components/landing/age-gate";
import { TikTokPixel } from "@/components/landing/tiktok-pixel";
import { resolveRedirect } from "@/server/redirect-resolver";

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
  const t = getDict(resolveLocale(campaign.locale));
  return { title: t.meta.title, description: t.meta.description };
}

export default async function LandingByHostPage() {
  // Dominio de cloaking (raíz, ej. dealdrop.lat/): redirigir antes de resolver la landing.
  const to = await resolveRedirect((await headers()).get("host"), "");
  if (to) redirect(to);

  const campaign = await campaignForHost();
  if (!campaign?.isActive) notFound();

  // Cloaker de campaña: si está ON, redirigimos a una whitepage (ropa) en vez de la landing.
  if (campaign.cloak) redirect(pickWhitepage(campaign.whitepages));

  const locale = resolveLocale(campaign.locale);
  const t = getDict(locale);

  const content = <LanderByTemplate campaign={campaign} templateSlug={campaign.templateSlug} />;

  // CTA con pregunta de edad: intercepta el click en cualquier CTA (+21 → oferta, -21 → oferta menor).
  const track = (url: string) =>
    campaign.slug ? `/api/click?s1=${encodeURIComponent(campaign.slug)}&to=${encodeURIComponent(url)}` : url;
  const ageEl = campaign.ctaAge ? (
    <AgeGate
      over21={track(campaign.ctaUrl)}
      under21={track(campaign.ctaUrlUnder || campaign.ctaUrl)}
      copy={getAgeCopy(locale)}
      accent={campaign.colorPrimary}
    />
  ) : null;

  // TikTok Pixel opcional por campaña (pageview + un único ClickButton en el CTA).
  const pixelEl = campaign.tiktokPixel ? <TikTokPixel pixelId={campaign.tiktokPixel} /> : null;

  // Intro swipe-up desactivable por campaña: si gate=false, mostramos la landing directo.
  if (!campaign.gate) return <>{content}{ageEl}{pixelEl}</>;

  return (
    <>
      <LanderGate
        variant={usesDarkGate(campaign.templateSlug) ? "v2" : "classic"}
        logoUrl={campaign.logoUrl}
        brand={brandFor(campaign.templateSlug) ?? campaign.name}
        primary={campaign.colorPrimary}
        bg={campaign.colorBg}
        headlineA={t.gate.headlineA}
        headlineHighlight={t.gate.headlineHighlight}
        headlineB={t.gate.headlineB}
        swipe={t.gate.swipe}
      >
        {content}
      </LanderGate>
      {ageEl}
      {pixelEl}
    </>
  );
}
