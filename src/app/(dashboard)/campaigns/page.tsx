import Link from "next/link";
import ReactCountryFlag from "react-country-flag";
import { api } from "@/trpc/server";
import type { RouterOutputs } from "@/trpc/react";
import { Plus, AlertTriangle, ExternalLink, CreditCard, Pencil, Package, LineChart } from "lucide-react";
import { getLocaleByCode } from "@/lib/locales";
import { CampaignCopyUrl } from "./_components/campaign-copy-url";
import { CampaignCloakToggle } from "./_components/campaign-cloak-toggle";
import { CampaignDelete } from "./_components/campaign-delete";
import { AnimatedBar } from "@/components/ui/animated-bar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Campañas" };

type Campaign = RouterOutputs["campaign"]["list"][number];
type VccInfo = { cardName: string; last4: string; currentSpend: number; spendLimit: number; count: number };

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const trailingNum = (name?: string) => { const m = /(\d+)\s*$/.exec(name ?? ""); return m ? parseInt(m[1]!) : 0; };

export default async function CampaignsPage() {
  let campaigns: Campaign[] = [];
  let dbError = false;

  try {
    campaigns = await api.campaign.list();
  } catch {
    dbError = true;
  }

  // VCCs por campaña (la más nueva + cantidad)
  const vccByCampaign = new Map<string, VccInfo>();
  try {
    const cardsRes = await api.cards.list();
    if (cardsRes.connected) {
      const cards = cardsRes.cards as unknown as Array<{ campaignId: string | null; cardName?: string; last4?: string; currentSpend?: number; spendLimit?: number }>;
      const groups = new Map<string, typeof cards>();
      for (const card of cards) {
        if (!card.campaignId) continue;
        const arr = groups.get(card.campaignId) ?? [];
        arr.push(card);
        groups.set(card.campaignId, arr);
      }
      for (const [cid, arr] of groups) {
        const newest = [...arr].sort((a, b) => trailingNum(b.cardName) - trailingNum(a.cardName))[0]!;
        vccByCampaign.set(cid, {
          cardName: newest.cardName ?? "VCC", last4: newest.last4 ?? "????",
          currentSpend: newest.currentSpend ?? 0, spendLimit: newest.spendLimit ?? 0, count: arr.length,
        });
      }
    }
  } catch { /* suite no conectada */ }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <header
        className="flex h-14 shrink-0 items-center px-4 md:px-8"
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
        <Link
          href="/campaigns/new"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Nueva campaña
        </Link>
      </header>

      {/* DB warning */}
      {dbError && (
        <div
          className="mx-4 mt-6 flex items-start gap-3 rounded-lg p-4 md:mx-8"
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
      <main className="flex-1 px-4 py-6 md:px-8">
        {campaigns.length === 0 && !dbError ? (
          <EmptyState />
        ) : (
          <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} vcc={vccByCampaign.get(c.id) ?? null} />
            ))}
          </div>
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

function CampaignCard({ campaign: c, vcc }: { campaign: Campaign; vcc: VccInfo | null }) {
  const loc = getLocaleByCode(c.locale);
  const url = c.domain ? `${c.domain}/${c.slug}` : `/${c.slug}`;
  const landingHref = c.domain ? `https://${c.domain}/${c.slug}` : `/landing/${c.slug}`;
  const pct = vcc && vcc.spendLimit > 0 ? Math.min(100, (vcc.currentSpend / vcc.spendLimit) * 100) : 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
      {/* Acento de color de la campaña */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${c.colorPrimary}, transparent 80%)` }} />

      {/* Franja de oferta */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
        {c.offerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.offerImage} alt="" className="h-6 w-6 shrink-0 rounded object-cover" />
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded" style={{ background: "var(--color-surface-raised)" }}>
            <Package className="h-3.5 w-3.5" style={{ color: "var(--color-subtle)" }} />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: c.offerName ? "var(--color-foreground)" : "var(--color-subtle)" }}>
          {c.offerName ?? "Sin oferta"}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium" style={{ color: c.isActive ? "var(--color-success)" : "var(--color-subtle)" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.isActive ? "var(--color-success)" : "var(--color-subtle)" }} />
          {c.isActive ? "Activa" : "Pausada"}
        </span>
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col px-4 py-3.5">
        <Link href={`/campaigns/${c.id}`} className="block truncate text-base font-semibold transition-opacity hover:opacity-70" style={{ fontFamily: "var(--font-brand)", color: "var(--color-foreground)" }}>
          {c.name}
        </Link>
        {/* Link de la landing + copiar + abrir */}
        <div className="mt-1 flex items-center gap-1">
          <span className="min-w-0 flex-1 truncate font-mono text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>{url}</span>
          <CampaignCopyUrl slug={c.slug} domain={c.domain} />
          <CampaignCloakToggle id={c.id} cloak={c.cloak} />
          <a href={landingHref} target="_blank" rel="noopener noreferrer" title="Abrir landing"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:opacity-70" style={{ color: "var(--color-muted-foreground)" }}>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-subtle)" }}>
          {loc?.countryCode ? (
            <ReactCountryFlag countryCode={loc.countryCode} svg style={{ width: "1.15em", height: "0.85em", borderRadius: 2 }} title={loc.label} />
          ) : (
            <span>🌐</span>
          )}
          <span>{c.currencyCode}</span>
        </div>

        {/* Acciones */}
        <div className="mt-3 flex items-center gap-1.5">
          <Link href={`/campaigns/${c.id}`}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
            <LineChart className="h-3.5 w-3.5" /> Supervisar
          </Link>
          <Link href={`/campaigns/${c.id}/edit`} title="Editar"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors hover:opacity-70"
            style={{ color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <CampaignDelete id={c.id} name={c.name} />
        </div>
      </div>

      {/* Franja de VCC */}
      <Link href={`/campaigns/${c.id}`} className="block px-4 py-2.5 transition-opacity hover:opacity-80" style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
        {vcc ? (
          <>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex min-w-0 items-center gap-1.5" style={{ color: "var(--color-foreground)" }}>
                <CreditCard className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-muted-foreground)" }} />
                <span className="truncate">{vcc.cardName}</span>
                <span className="shrink-0 font-mono" style={{ color: "var(--color-subtle)" }}>·· {vcc.last4}</span>
              </span>
              <span className="shrink-0 font-mono tabular-nums" style={{ color: "var(--color-muted-foreground)" }}>
                {usd(vcc.currentSpend)} / {usd(vcc.spendLimit)}
              </span>
            </div>
            <div className="mt-1.5">
              <AnimatedBar pct={pct} color={c.colorPrimary} track="var(--color-surface-raised)" height={4} radius={999} />
            </div>
            {vcc.count > 1 && (
              <span className="mt-1 block text-[10px]" style={{ color: "var(--color-subtle)" }}>+{vcc.count - 1} tarjeta{vcc.count - 1 > 1 ? "s" : ""} más</span>
            )}
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-subtle)" }}>
            <CreditCard className="h-3.5 w-3.5" /> Sin tarjeta asignada
          </span>
        )}
      </Link>
    </div>
  );
}
