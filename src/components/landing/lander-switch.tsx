import { Lander, type LanderCampaign } from "@/components/landing/lander";
import { LanderV2 } from "@/components/landing/lander-v2";
import { LanderQuest } from "@/components/landing/lander-quest";
import { isV2Template, isQuestTemplate, brandFor } from "@/lib/landing-templates";
import type { LanderLocale } from "@/lib/lander-i18n";

/** Renderiza el lander según la plantilla de la campaña. */
export function LanderByTemplate({
  campaign, templateSlug, localeOverride, payouts24h = null, offerEndsAt = null,
}: {
  campaign: LanderCampaign;
  templateSlug?: string | null;
  localeOverride?: LanderLocale;
  /** Quest: pagos reales últimas 24 h (null → el bloque no se renderiza). */
  payouts24h?: number | null;
  /** Quest: vencimiento real de la oferta en ISO (null → sin contador). */
  offerEndsAt?: string | null;
}) {
  if (isQuestTemplate(templateSlug)) {
    return (
      <LanderQuest
        campaign={campaign}
        localeOverride={localeOverride}
        brand={brandFor(templateSlug) ?? undefined}
        payouts24h={payouts24h}
        offerEndsAt={offerEndsAt}
      />
    );
  }
  if (isV2Template(templateSlug)) return <LanderV2 campaign={campaign} localeOverride={localeOverride} brand={brandFor(templateSlug) ?? "FreeCash"} />;
  return <Lander campaign={campaign} />;
}
