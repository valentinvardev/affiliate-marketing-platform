import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { api } from "@/trpc/server";
import { CampaignForm } from "@/components/campaign-form";

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

  const configUrl = `/api/config/${campaign.slug}`;

  return (
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
          {/* Config URL card */}
          <div
            className="rounded-xl p-4"
            style={{
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-raised)",
            }}
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
                title="Abrir"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="mt-2 text-[11px]" style={{ color: "var(--color-subtle)" }}>
              Tu plantilla debe hacer <code className="font-mono">GET</code> a esta URL con <code className="font-mono">?c={campaign.slug}</code>
            </p>
          </div>

          {/* Form */}
          <div
            className="rounded-xl p-6"
            style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
          >
            <h2 className="mb-6 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              Configuración
            </h2>
            <CampaignForm campaign={campaign} />
          </div>
        </div>
      </main>
    </div>
  );
}
