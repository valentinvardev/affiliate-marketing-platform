import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";
import { suiteFetch } from "@/lib/suite";
import { getLocaleByCode } from "@/lib/locales";
import { StatsChart, type ChartPoint } from "@/app/(dashboard)/stats/_components/stats-chart";
import { ConversionList } from "@/app/(dashboard)/stats/_components/conversion-list";
import { SpendPanel, type LinkedCard } from "./_components/spend-panel";
import { ChevronLeft, Pencil, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await db.campaign.findUnique({ where: { id } });
  return { title: c?.name ?? "Campaña" };
}

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

function buildDaily(convs: { price: number; receivedAt: Date }[], days = 14): ChartPoint[] {
  const now = new Date();
  const buckets: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    buckets[`${d.getMonth() + 1}/${d.getDate()}`] = 0;
  }
  for (const c of convs) {
    const d = new Date(c.receivedAt);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    if (label in buckets) buckets[label]! += c.price;
  }
  return Object.entries(buckets).map(([label, revenue]) => ({ label, revenue: +revenue.toFixed(2) }));
}

export default async function CampaignOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";
  if (!isAdmin && campaign.ownerId && campaign.ownerId !== session?.user?.id) notFound();

  const loc = getLocaleByCode(campaign.locale);

  // Conversiones de este subid (s1 = slug)
  const convs = await db.conversion.findMany({ where: { s1: campaign.slug }, orderBy: { receivedAt: "desc" } });
  const revenue = convs.reduce((s, c) => s + c.price, 0);
  const count = convs.length;
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const todayRevenue = convs.filter((c) => new Date(c.receivedAt) >= startToday).reduce((s, c) => s + c.price, 0);
  const avg = count > 0 ? revenue / count : 0;
  const chart = buildDaily(convs);

  // Tarjetas vinculadas + gasto (live de la suite)
  const linkOwners = await db.cardOwner.findMany({ where: { campaignId: id } });
  const linkedIds = new Set(linkOwners.map((o) => o.vccId));
  const linked: LinkedCard[] = [];
  let spend = 0;
  if (linkedIds.size) {
    const { ok, data } = await suiteFetch("vcc");
    if (ok) {
      const all = ((data.vccs as { id: string; cardName?: string; last4?: string; currentSpend?: number; spendLimit?: number }[]) ?? []);
      for (const c of all) {
        if (linkedIds.has(c.id)) {
          linked.push({ vccId: c.id, cardName: c.cardName ?? "", last4: c.last4 ?? "????", currentSpend: c.currentSpend ?? 0, spendLimit: c.spendLimit ?? 0 });
          spend += c.currentSpend ?? 0;
        }
      }
    }
  }

  const profit = revenue - spend;
  const up = profit >= 0;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Link href="/campaigns" className="inline-flex shrink-0 items-center gap-1 text-xs transition-opacity hover:opacity-60" style={{ color: "var(--color-muted-foreground)" }}>
          <ChevronLeft className="h-3.5 w-3.5" />Campañas
        </Link>
        <span style={{ color: "var(--color-border)" }}>/</span>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: campaign.colorPrimary }} />
        <span className="truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{campaign.name}</span>
        <span className="hidden items-center rounded-md px-2 py-0.5 font-mono text-[11px] sm:inline-flex" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
          s1·{campaign.slug}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px]" style={{ color: campaign.isActive ? "var(--color-success)" : "var(--color-subtle)" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: campaign.isActive ? "var(--color-success)" : "var(--color-subtle)" }} />
          {campaign.isActive ? "Activa" : "Pausada"}
        </span>
        <a href={`/landing/${campaign.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:opacity-70" style={{ color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }} title="Ver landing"><ExternalLink className="h-3.5 w-3.5" /></a>
        <Link href={`/campaigns/${campaign.id}/edit`} className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:opacity-70" style={{ color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }} title="Editar"><Pencil className="h-3.5 w-3.5" /></Link>
      </header>

      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-5xl space-y-4">

          {/* ── P&L + gasto ── */}
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <section className="relative overflow-hidden rounded-2xl p-6 md:p-7" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
              <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full" style={{ background: `radial-gradient(circle, color-mix(in oklch, ${up ? "var(--color-success)" : "var(--color-error)"} 9%, transparent) 0%, transparent 70%)` }} />
              <div className="relative">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-subtle)" }}>P&amp;L · este subid</span>
                <div className="mt-2 flex items-center gap-2">
                  {up ? <TrendingUp className="h-5 w-5" style={{ color: "var(--color-success)" }} /> : <TrendingDown className="h-5 w-5" style={{ color: "var(--color-error)" }} />}
                  <p className="tabular-nums leading-none" style={{ fontFamily: "var(--font-brand)", fontWeight: 900, fontSize: "clamp(2.25rem, 6vw, 3.5rem)", letterSpacing: "-0.03em", color: up ? "var(--color-success)" : "var(--color-error)" }}>
                    {usd(profit)}
                  </p>
                </div>
                <p className="mt-3 font-mono text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  ingresos <span style={{ color: "var(--color-success)" }}>{usd(revenue)}</span> − gasto <span style={{ color: "var(--color-error)" }}>{usd(spend)}</span>
                </p>
                <div className="mt-5">
                  <StatsChart data={chart} label="Ingresos · 14 días" />
                </div>
              </div>
            </section>

            <SpendPanel campaignId={campaign.id} linked={linked} />
          </div>

          {/* ── Stat tiles ── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Ingresos" value={usd(revenue)} />
            <Tile label="Conversiones" value={String(count)} />
            <Tile label="Ticket prom." value={usd(avg)} />
            <Tile label="Hoy" value={usd(todayRevenue)} accent={todayRevenue > 0} />
          </div>

          {/* ── Conversiones ── */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-subtle)" }}>Conversiones</span>
              <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>{loc?.flag ?? "🌐"} {campaign.currencyCode}</span>
            </div>
            <ConversionList conversions={convs} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-subtle)" }}>{label}</p>
      <p className="mt-1.5 tabular-nums text-xl font-bold" style={{ fontFamily: "var(--font-mono)", color: accent ? "var(--color-success)" : "var(--color-foreground)" }}>{value}</p>
    </div>
  );
}
