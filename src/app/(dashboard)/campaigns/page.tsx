import Link from "next/link";
import { api } from "@/trpc/server";
import type { RouterOutputs } from "@/trpc/react";
import { Plus, AlertTriangle, ExternalLink } from "lucide-react";
import { getLocaleByCode } from "@/lib/locales";
import { CampaignToggle } from "./_components/campaign-toggle";
import { CampaignCopyUrl } from "./_components/campaign-copy-url";
import { CampaignDelete } from "./_components/campaign-delete";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campañas" };

type Campaign = RouterOutputs["campaign"]["list"][number];

export default async function CampaignsPage() {
  let campaigns: Campaign[] = [];
  let dbError = false;

  try {
    campaigns = await api.campaign.list();
  } catch {
    dbError = true;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <header
        className="flex h-14 shrink-0 items-center px-8"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
          Campañas
        </h1>
        {!dbError && (
          <span
            className="ml-2.5 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
            style={{
              background: "var(--color-surface-overlay)",
              color: "var(--color-muted-foreground)",
              border: "1px solid var(--color-border)",
            }}
          >
            {campaigns.length}
          </span>
        )}
      </header>

      {/* DB warning */}
      {dbError && (
        <div
          className="mx-8 mt-6 flex items-start gap-3 rounded-lg p-4"
          style={{
            background: "var(--color-warning-bg)",
            border: "1px solid rgba(245,166,35,0.2)",
          }}
        >
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-warning)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-warning)" }}>
              Base de datos no configurada
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              Rellena <code className="font-mono">.env</code> con tus credenciales de Supabase y ejecuta{" "}
              <code className="font-mono">npx prisma db push</code>.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-8 py-6">
        {campaigns.length === 0 && !dbError ? (
          <EmptyState />
        ) : (
          <CampaignTable campaigns={campaigns} />
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl py-24 text-center"
      style={{ border: "1px dashed var(--color-border)" }}
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "var(--color-surface-raised)" }}
      >
        <Plus className="h-5 w-5" style={{ color: "var(--color-muted-foreground)" }} />
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
        Sin campañas
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        Crea tu primera campaña para empezar.
      </p>
      <Link
        href="/campaigns/new"
        className="mt-6 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
        style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
      >
        <Plus className="h-3.5 w-3.5" />
        Nueva campaña
      </Link>
    </div>
  );
}

function CampaignTable({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div
      className="overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--color-border)" }}
    >
      {/* Table head */}
      <div
        className="grid items-center px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider"
        style={{
          color: "var(--color-muted-foreground)",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          gridTemplateColumns: "1fr 120px 120px 90px 130px",
        }}
      >
        <span>Campaña</span>
        <span>Idioma</span>
        <span>Moneda</span>
        <span>Estado</span>
        <span className="text-right">Acciones</span>
      </div>

      {/* Rows */}
      <div style={{ background: "var(--color-surface)" }}>
        {campaigns.map((c, i) => (
          <CampaignRow
            key={c.id}
            campaign={c}
            last={i === campaigns.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function CampaignRow({ campaign: c, last }: { campaign: Campaign; last: boolean }) {
  const loc = getLocaleByCode(c.locale);

  return (
    <div
      className="table-row-hover grid items-center px-4 py-3.5"
      style={{
        gridTemplateColumns: "1fr 120px 120px 90px 130px",
        borderBottom: last ? "none" : "1px solid var(--color-border)",
      }}
    >
      {/* Name + slug */}
      <div className="flex items-center gap-3 min-w-0 pr-4">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: c.colorPrimary }}
        />
        <div className="min-w-0">
          <Link
            href={`/campaigns/${c.id}`}
            className="block truncate text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: "var(--color-foreground)" }}
          >
            {c.name}
          </Link>
          <span
            className="block truncate font-mono text-[11px] mt-0.5"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            {c.slug}
          </span>
        </div>
      </div>

      {/* Locale */}
      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        <span>{loc?.flag ?? "🌐"}</span>
        <span className="truncate">{loc?.label?.split(" ")[0] ?? c.locale}</span>
      </div>

      {/* Currency */}
      <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        <span className="font-mono font-medium" style={{ color: "var(--color-foreground)" }}>
          {c.currencySymbol}
        </span>
        <span>{c.currencyCode}</span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        {c.isActive ? (
          <>
            <span className="status-dot-green" />
            <span className="text-xs" style={{ color: "var(--color-success)" }}>Activa</span>
          </>
        ) : (
          <>
            <span className="status-dot-gray" />
            <span className="text-xs" style={{ color: "var(--color-subtle)" }}>Pausada</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1">
        <a
          href={`/landing/${c.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
          style={{ color: "var(--color-muted-foreground)" }}
          title="Ver landing"
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-surface-overlay)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-foreground)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-muted-foreground)"; }}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <CampaignCopyUrl slug={c.slug} />
        <CampaignToggle id={c.id} isActive={c.isActive} />
        <Link
          href={`/campaigns/${c.id}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors"
          style={{ color: "var(--color-muted-foreground)" }}
          title="Editar"
        >
          ✎
        </Link>
        <CampaignDelete id={c.id} name={c.name} />
      </div>
    </div>
  );
}
