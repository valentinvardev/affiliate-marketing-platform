import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";
import { suiteFetch } from "@/lib/suite";
import { getLocaleByCode } from "@/lib/locales";
import { ConversionList } from "@/app/(dashboard)/stats/_components/conversion-list";
import { SpendPanel, type LinkedCard } from "./_components/spend-panel";
import { CopyLink } from "./_components/copy-link";
import { ChevronLeft, Pencil, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await db.campaign.findUnique({ where: { id } });
  return { title: c?.name ?? "Campaña" };
}

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

type PnlPoint = { label: string; profit: number; spend: number };

/** Profit acumulado vs gasto, dos líneas sobre la misma escala con baseline en 0. */
function buildPnl(convs: { price: number; receivedAt: Date }[], spend: number, days = 14): PnlPoint[] {
  const today = new Date(); today.setHours(23, 59, 59, 999);
  const out: PnlPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const end = new Date(today); end.setDate(today.getDate() - i);
    const cumRev = convs.filter((c) => new Date(c.receivedAt) <= end).reduce((s, c) => s + c.price, 0);
    out.push({ label: `${end.getMonth() + 1}/${end.getDate()}`, profit: +(cumRev - spend).toFixed(2), spend: +spend.toFixed(2) });
  }
  return out;
}

/* ─── Chart comparativo Profit vs Gasto ─── */
function PnlChart({ data }: { data: PnlPoint[] }) {
  const W = 600, H = 180, padX = 10, padT = 14, padB = 22;
  const n = data.length;
  const profits = data.map((d) => d.profit);
  const spends = data.map((d) => d.spend);
  const max = Math.max(...profits, ...spends, 0);
  const min = Math.min(...profits, ...spends, 0);
  const range = (max - min) || 1;
  const x = (i: number) => padX + (n <= 1 ? 0 : (i / (n - 1)) * (W - 2 * padX));
  const y = (v: number) => padT + (1 - (v - min) / range) * (H - padT - padB);
  const line = (vals: number[]) => vals.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const zeroY = y(0);
  const last = data[n - 1] ?? { profit: 0, spend: 0 };
  const profitColor = last.profit >= 0 ? "#50e3c2" : "#ff4444";
  const profitArea = `${line(profits)} L ${x(n - 1).toFixed(1)} ${zeroY.toFixed(1)} L ${x(0).toFixed(1)} ${zeroY.toFixed(1)} Z`;

  return (
    <div>
      {/* leyenda */}
      <div className="mb-2 flex items-center gap-4 text-[11px]">
        <span className="inline-flex items-center gap-1.5" style={{ color: "var(--color-muted-foreground)" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: profitColor }} /> Profit
          <span className="font-mono tabular-nums" style={{ color: profitColor }}>{usd(last.profit)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5" style={{ color: "var(--color-muted-foreground)" }}>
          <span className="h-2 w-2 rounded-full" style={{ background: "#ff4444" }} /> Gasto
          <span className="font-mono tabular-nums" style={{ color: "#ff4444" }}>{usd(last.spend)}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-44 w-full" style={{ display: "block" }}>
        <defs>
          <linearGradient id="pnlfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={profitColor} stopOpacity="0.16" />
            <stop offset="100%" stopColor={profitColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* baseline 0 */}
        <line x1={padX} y1={zeroY} x2={W - padX} y2={zeroY} stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        {/* área de profit */}
        <path d={profitArea} fill="url(#pnlfill)" />
        {/* gasto (rojo, punteado) */}
        <path d={line(spends)} fill="none" stroke="#ff4444" strokeWidth="1.5" strokeDasharray="5 4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {/* profit */}
        <path d={line(profits)} fill="none" stroke={profitColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <circle cx={x(n - 1)} cy={y(last.profit)} r="2.5" fill={profitColor} />
      </svg>
      {/* eje X */}
      <div className="mt-1 flex justify-between font-mono text-[9px] tabular-nums" style={{ color: "var(--color-subtle)" }}>
        <span>{data[0]?.label}</span><span>{data[Math.floor(n / 2)]?.label}</span><span>{last && data[n - 1]?.label}</span>
      </div>
    </div>
  );
}

export default async function CampaignOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";
  // Un usuario solo ve su propia campaña (las sin dueño también quedan ocultas).
  if (!isAdmin && campaign.ownerId !== session?.user?.id) notFound();

  const loc = getLocaleByCode(campaign.locale);

  // Conversiones de este subid (s1 = slug)
  const convs = await db.conversion.findMany({ where: { s1: campaign.slug }, orderBy: { receivedAt: "desc" } });
  const revenue = convs.reduce((s, c) => s + c.price, 0);
  const count = convs.length;
  const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
  const todayRevenue = convs.filter((c) => new Date(c.receivedAt) >= startToday).reduce((s, c) => s + c.price, 0);
  const avg = count > 0 ? revenue / count : 0;

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
  const pnl = buildPnl(convs, spend);

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
        <div className="ml-auto flex shrink-0 items-center gap-2">
        <CopyLink domain={campaign.domain} slug={campaign.slug} />
        <a href={campaign.domain ? `https://${campaign.domain}/${campaign.slug}` : `/landing/${campaign.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:opacity-70" style={{ color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }} title="Ver landing"><ExternalLink className="h-3.5 w-3.5" /></a>
        <Link href={`/campaigns/${campaign.id}/edit`} className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:opacity-70" style={{ color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }} title="Editar"><Pencil className="h-3.5 w-3.5" /></Link>
        </div>
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
                  <PnlChart data={pnl} />
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
