import { Lander, type LanderCampaign } from "@/components/landing/lander";
import { LanderV2 } from "@/components/landing/lander-v2";
import { resolveTemplate } from "@/lib/landing-templates";
import type { LanderLocale } from "@/lib/lander-i18n";

/** Renderiza el lander según la plantilla de la campaña. */
export function LanderByTemplate({ campaign, templateSlug, localeOverride }: { campaign: LanderCampaign; templateSlug?: string | null; localeOverride?: LanderLocale }) {
  if (resolveTemplate(templateSlug) === "freecash-v2") return <LanderV2 campaign={campaign} localeOverride={localeOverride} />;
  return <Lander campaign={campaign} />;
}
