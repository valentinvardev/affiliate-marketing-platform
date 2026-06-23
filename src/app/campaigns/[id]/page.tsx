import Link from "next/link";
import { notFound } from "next/navigation";
import { api } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CampaignForm } from "@/components/campaign-form";
import { ChevronLeft, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/campaigns">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{campaign.name}</h1>
            <p className="text-xs text-muted-foreground">Aff CMS</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {/* API URL info box */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">URL de configuración pública</CardTitle>
            <CardDescription className="text-xs">
              Usa esta URL en tu plantilla con <code>?c={campaign.slug}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 rounded-md bg-background border px-3 py-2">
              <code className="text-xs flex-1 truncate">{configUrl}</code>
              <Button asChild variant="ghost" size="sm">
                <a href={configUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Responde con JSON: locale, currencySymbol, ctaUrl, colorPrimary, colorBg, logoUrl
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Editar campaña</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignForm campaign={campaign} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
