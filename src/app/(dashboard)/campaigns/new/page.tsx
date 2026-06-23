import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CampaignForm } from "@/components/campaign-form";

export const metadata = { title: "Nueva campaña" };

export default function NewCampaignPage() {
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
        <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
          Nueva campaña
        </span>
      </header>

      {/* Form */}
      <main className="flex-1 px-8 py-8">
        <div className="mx-auto max-w-2xl">
          <CampaignForm />
        </div>
      </main>
    </div>
  );
}
