import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { api } from "@/trpc/server";
import { HydrateClient } from "@/trpc/server";
import { CampaignForm } from "@/components/campaign-form";
import { OfferManager } from "@/components/offer-manager";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const c = await api.campaign.byId({ id });
    return { title: c.name };
  } catch {
    return { title: "Campaña" };
  }
}

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let campaign;
  try {
    campaign = await api.campaign.byId({ id });
  } catch {
    notFound();
  }

  // Prefetch offers for the client
  void api.offer.listByCampaign.prefetch({ campaignId: id });
  const initialOffers = await api.offer.listByCampaign({ campaignId: id });

  const configUrl = `/api/config/${campaign.slug}`;

  return (
    <HydrateClient>
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header
          className="flex h-14 shrink-0 items-center gap-3 px-8"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-60"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Campañas
          </Link>
          <span style={{ color: "var(--color-border)" }}>/</span>
          <span className="text-sm font-medium truncate max-w-[200px]" style={{ color: "var(--color-foreground)" }}>
            {campaign.name}
          </span>
        </header>

        <main className="flex-1 px-8 py-8">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* Config URL */}
            <div
              className="rounded-xl p-4"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
            >
              <p className="mb-1 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                URL de configuración pública
              </p>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 truncate rounded-md px-3 py-1.5 font-mono text-xs"
                  style={{
                    background: "var(--color-surface-overlay)",
                    color: "var(--color-foreground)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {configUrl}
                </code>
                <a
                  href={configUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                  style={{ color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Campaign settings — studio */}
            <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
              <CampaignForm campaign={campaign} />
            </div>

            {/* Offers */}
            <SectionCard
              title="Ofertas / Aplicaciones"
              description="Las apps que aparecen en la grilla de la plantilla. Monto en número, el símbolo de moneda lo pone la plantilla."
            >
              <OfferManager
                campaignId={campaign.id}
                currencySymbol={campaign.currencySymbol}
                initialOffers={initialOffers}
              />
            </SectionCard>
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
    >
      <div className="mb-5">
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}
