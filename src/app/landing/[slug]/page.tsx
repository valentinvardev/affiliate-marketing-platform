import { db } from "@/server/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { LanderByTemplate } from "@/components/landing/lander-switch";
import { LanderGate } from "@/components/landing/lander-gate";
import { usesDarkGate, brandFor } from "@/lib/landing-templates";
import { pickWhitepage } from "@/lib/whitepages";
import { visitorCountry, isBlocked } from "@/lib/geo";
import { allowedCountries } from "@/lib/locales";
import { getDict, resolveLocale } from "@/lib/lander-i18n";
import { getAgeCopy } from "@/lib/age-gate-i18n";
import { AgeGate } from "@/components/landing/age-gate";
import { TikTokPixel } from "@/components/landing/tiktok-pixel";
import { resolveRedirect } from "@/server/redirect-resolver";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await db.campaign.findUnique({ where: { slug } });
  if (!campaign) return {};
  const t = getDict(resolveLocale(campaign.locale));
  return { title: t.meta.title, description: t.meta.description };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Redirector de cloaking en dominio/ruta (ej. dealdrop.lat/1): redirigir antes de servir.
  const to = await resolveRedirect((await headers()).get("host"), slug);
  if (to) redirect(to);

  const campaign = await db.campaign.findUnique({
    where: { slug },
    include: { offers: { orderBy: { position: "asc" } } },
  });

  if (!campaign?.isActive) notFound();

  // Cloaker de campaña: si está ON, redirigimos a una whitepage (ropa) en vez de la landing.
  if (campaign.cloak) redirect(pickWhitepage(campaign.whitepages));

  // Filtro de geo: si está ON, el tráfico fuera del país objetivo va a la
  // whitepage, igual que con el cloaker. Falla abierto (país desconocido pasa).
  if (campaign.geoGate) {
    const allowed = allowedCountries(campaign.locale, campaign.geoCountries);
    const country = await visitorCountry(await headers());
    if (isBlocked(country, allowed)) redirect(pickWhitepage(campaign.whitepages));
  }


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
