import Link from "next/link";
import { api } from "@/trpc/server";
import type { RouterOutputs } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Globe, AlertTriangle } from "lucide-react";
import { getLocaleByCode } from "@/lib/locales";
import { CampaignToggle } from "./_components/campaign-toggle";
import { CampaignCopyUrl } from "./_components/campaign-copy-url";
import { CampaignDelete } from "./_components/campaign-delete";

type Campaign = RouterOutputs["campaign"]["list"][number];

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  let campaigns: Campaign[] = [];
  let dbError = false;

  try {
    campaigns = await api.campaign.list();
  } catch {
    dbError = true;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Aff CMS</h1>
            <p className="text-xs text-muted-foreground">Gestor de plantillas de afiliados</p>
          </div>
          <Button asChild>
            <Link href="/campaigns/new">
              <Plus className="h-4 w-4" />
              Nueva campaña
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {dbError && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 text-sm">Base de datos no configurada</p>
                <p className="text-amber-700 text-xs mt-1">
                  Rellena las credenciales de Supabase en <code className="bg-amber-100 px-1 rounded">.env</code> y
                  ejecuta <code className="bg-amber-100 px-1 rounded">npx prisma db push</code> para conectar la DB.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {campaigns.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">Sin campañas aún</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Crea tu primera campaña para empezar a gestionar plantillas.
              </p>
              <Button asChild>
                <Link href="/campaigns/new">
                  <Plus className="h-4 w-4" />
                  Crear campaña
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {campaigns.length} campaña{campaigns.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c: Campaign) => {
                const loc = getLocaleByCode(c.locale);
                return (
                  <Card key={c.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-5 w-5 shrink-0 rounded-full border"
                            style={{ background: c.colorPrimary }}
                          />
                          <CardTitle className="text-base truncate">{c.name}</CardTitle>
                        </div>
                        <Badge variant={c.isActive ? "success" : "secondary"} className="shrink-0">
                          {c.isActive ? "Activa" : "Pausada"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span>{loc?.flag ?? "🌐"}</span>
                        <span>{loc?.label ?? c.locale}</span>
                        <span>·</span>
                        <span className="font-mono">{c.currencySymbol}</span>
                        <span>({c.currencyCode})</span>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-3">
                      <div className="rounded-md bg-muted px-3 py-2 text-xs font-mono text-muted-foreground truncate">
                        {c.slug}
                      </div>

                      <div className="text-xs text-muted-foreground truncate">
                        <span className="font-medium">CTA:</span>{" "}
                        <a
                          href={c.ctaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {new URL(c.ctaUrl).hostname}
                        </a>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/campaigns/${c.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Link>
                        </Button>
                        <CampaignCopyUrl slug={c.slug} />
                        <CampaignToggle id={c.id} isActive={c.isActive} />
                        <CampaignDelete id={c.id} name={c.name} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
