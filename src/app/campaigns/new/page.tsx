import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CampaignForm } from "@/components/campaign-form";
import { ChevronLeft } from "lucide-react";

export default function NewCampaignPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/campaigns">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Nueva campaña</h1>
            <p className="text-xs text-muted-foreground">Aff CMS</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de campaña</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
