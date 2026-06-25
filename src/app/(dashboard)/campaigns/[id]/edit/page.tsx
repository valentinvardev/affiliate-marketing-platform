import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { api } from "@/trpc/server";
import { HydrateClient } from "@/trpc/server";
import { CampaignForm } from "@/components/campaign-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const c = await api.campaign.byId({ id });
    return { title: `Editar ${c.name}` };
  } catch {
    return { title: "Editar campaña" };
  }
}

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let campaign;
  try {
    campaign = await api.campaign.byId({ id });
  } catch {
    notFound();
  }

  return (
    <HydrateClient>
      <div className="flex flex-col min-h-screen">
        <header className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <Link href={`/campaigns/${campaign.id}`} className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-60" style={{ color: "var(--color-muted-foreground)" }}>
            <ChevronLeft className="h-3.5 w-3.5" />
            {campaign.name}
          </Link>
          <span style={{ color: "var(--color-border)" }}>/</span>
          <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Editar</span>
        </header>

        <main className="flex-1 px-4 py-8 md:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
              <CampaignForm campaign={campaign} />
            </div>
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}
