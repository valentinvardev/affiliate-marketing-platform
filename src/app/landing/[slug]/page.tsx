import { db } from "@/server/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Lander } from "@/components/landing/lander";
import { LanderGate } from "@/components/landing/lander-gate";
import { getDict, type LanderLocale } from "@/lib/lander-i18n";

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

  const campaign = await db.campaign.findUnique({
    where: { slug },
    include: { offers: { orderBy: { position: "asc" } } },
  });

  if (!campaign?.isActive) notFound();

  const t = getDict((campaign.locale as LanderLocale) ?? "en");

  return (
    <LanderGate
      primary={campaign.colorPrimary}
      bg={campaign.colorBg}
      headlineA={t.gate.headlineA}
      headlineHighlight={t.gate.headlineHighlight}
      headlineB={t.gate.headlineB}
      swipe={t.gate.swipe}
    >
      <Lander campaign={campaign} />
    </LanderGate>
  );
}
