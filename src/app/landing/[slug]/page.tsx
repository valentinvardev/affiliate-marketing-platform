import { db } from "@/server/db";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { LanderByTemplate } from "@/components/landing/lander-switch";
import { LanderGate } from "@/components/landing/lander-gate";
import { resolveTemplate } from "@/lib/landing-templates";
import { getDict, type LanderLocale } from "@/lib/lander-i18n";
import { resolveRedirect } from "@/server/redirect-resolver";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await db.campaign.findUnique({ where: { slug } });
  if (!campaign) return {};
  const t = getDict((campaign.locale as LanderLocale) ?? "en");
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

  const t = getDict((campaign.locale as LanderLocale) ?? "en");

  return (
    <LanderGate
      variant={resolveTemplate(campaign.templateSlug) === "freecash-v2" ? "v2" : "classic"}
      logoUrl={campaign.logoUrl}
      brand={campaign.name}
      primary={campaign.colorPrimary}
      bg={campaign.colorBg}
      headlineA={t.gate.headlineA}
      headlineHighlight={t.gate.headlineHighlight}
      headlineB={t.gate.headlineB}
      swipe={t.gate.swipe}
    >
      <LanderByTemplate campaign={campaign} templateSlug={campaign.templateSlug} />
    </LanderGate>
  );
}
