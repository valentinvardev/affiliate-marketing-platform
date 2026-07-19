import Link from "next/link";
import { headers } from "next/headers";
import { db } from "@/server/db";
import { getScope, convWhere, campaignWhere } from "@/lib/scope";
import { fetchStats, type StatsRange } from "@/lib/taprain";
import { DollarSign, Repeat2, MousePointerClick, Zap, AlertTriangle } from "lucide-react";
import { StatsChart, type ChartPoint } from "./_components/stats-chart";
import { ConversionList } from "./_components/conversion-list";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AutoRefresh } from "./_components/auto-refresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estadísticas" };

const RANGES: { key: StatsRange; label: string }[] = [
  { key: "hour",      label: "Última hora" },
  { key: "today",     label: "Hoy" },
  { key: "yesterday", label: "Ayer" },
  { key: "7days",     label: "7 días" },
  { key: "30days",    label: "30 días" },
];

/* Date window for each range */
function getWindow(range: StatsRange): { from: Date; to: Date } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case "hour":
      return { from: new Date(now.getTime() - 60 * 60 * 1000), to: now };
    case "today":
      return { from: startOfDay, to: now };
    case "yesterday": {
      const yStart = new Date(startOfDay.getTime() - 86_400_000);
      return { from: yStart, to: startOfDay };
    }
    case "7days":
      return { from: new Date(startOfDay.getTime() - 7 * 86_400_000), to: now };
    case "30days":
      return { from: new Date(startOfDay.getTime() - 30 * 86_400_000), to: now };
  }
}

/* Group conversions into chart buckets */
function buildChartData(
  conversions: { price: number; receivedAt: Date }[],
  range: StatsRange,
  window: { from: Date; to: Date },
): ChartPoint[] {
  if (range === "hour") {
    // 12 buckets of 5 minutes
    const buckets: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const t = new Date(window.to.getTime() - i * 5 * 60 * 1000);
      const label = `${String(t.getHours()).padStart(2, "0")}:${String(Math.floor(t.getMinutes() / 5) * 5).padStart(2, "0")}`;
      buckets[label] = 0;
    }
    for (const c of conversions) {
      const t = new Date(c.receivedAt);
      const label = `${String(t.getHours()).padStart(2, "0")}:${String(Math.floor(t.getMinutes() / 5) * 5).padStart(2, "0")}`;
      if (label in buckets) buckets[label]! += c.price;
    }
    return Object.entries(buckets).map(([label, revenue]) => ({ label, revenue: +revenue.toFixed(2) }));
  }

  if (range === "today" || range === "yesterday") {
    // 24 hourly buckets
    const buckets: Record<string, number> = {};
    for (let h = 0; h < 24; h++) {
      buckets[`${String(h).padStart(2, "0")}h`] = 0;
    }
    for (const c of conversions) {
      const h = new Date(c.receivedAt).getHours();
      buckets[`${String(h).padStart(2, "0")}h`]! += c.price;
    }
    return Object.entries(buckets).map(([label, revenue]) => ({ label, revenue: +revenue.toFixed(2) }));
  }

  // 7days / 30days: one bucket per day
  const days = range === "7days" ? 7 : 30;
  const buckets: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(window.to.getTime() - i * 86_400_000);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    buckets[label] = 0;
  }
  for (const c of conversions) {
    const d = new Date(c.receivedAt);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    if (label in buckets) buckets[label]! += c.price;
  }
  return Object.entries(buckets).map(([label, revenue]) => ({ label, revenue: +revenue.toFixed(2) }));
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; c?: string }>;
}) {
  const { range: rawRange = "today", c: rawC } = await searchParams;
  const range = (RANGES.some((r) => r.key === rawRange) ? rawRange : "today") as StatsRange;
  const window = getWindow(range);

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${proto}://${host}`;

  const { slugs, isAdmin, userId } = await getScope();

  // Campañas del usuario (admin → todas) para el selector.
  const campaigns = await db.campaign.findMany({
    where: campaignWhere(isAdmin, userId),
    select: { id: true, name: true, slug: true, colorPrimary: true },
    orderBy: { name: "asc" },
  });
  // Sólo se permite filtrar por una campaña visible para el usuario.
  const selected = rawC && campaigns.some((cm) => cm.slug === rawC) ? rawC : null;
  const selectedCampaign = selected ? campaigns.find((cm) => cm.slug === selected)! : null;

  const convScope = selected ? { s1: selected } : convWhere(slugs);
  const clickWhere = selected
    ? { s1: selected }
    : slugs === null ? {} : { s1: { in: slugs.length ? slugs : ["__no-match__"] } };

  // Fetch TapRain summary stats + conversiones/clicks locales en paralelo
  const [statsResult, conversions, clicksRes] = await Promise.allSettled([
    fetchStats(range),
    db.conversion.findMany({
      where: { ...convScope, receivedAt: { gte: window.from, lte: window.to } },
      orderBy: { receivedAt: "desc" },
    }),
    db.click.count({ where: { ...clickWhere, createdAt: { gte: window.from, lte: window.to } } }),
  ]);

  const data    = statsResult.status === "fulfilled" ? statsResult.value : null;
  // El summary de TapRain es global de la cuenta → solo admin y vista "Todas".
  const apiError = isAdmin && !selected && statsResult.status === "rejected"
    ? (statsResult.reason instanceof Error ? statsResult.reason.message : "Error desconocido")
    : null;

  const convList = conversions.status === "fulfilled" ? conversions.value : [];
  const clicks   = clicksRes.status === "fulfilled" ? clicksRes.value : 0;
  const chartData = buildChartData(convList, range, window);

  // Local summary (fallback / supplement when API has no clicks data)
  const localRevenue = convList.reduce((s, c) => s + c.price, 0);
  const localCount   = convList.length;

  const summary = selected ? undefined : (isAdmin ? data?.summary : undefined);
  const rangeLabel = RANGES.find((r) => r.key === range)?.label ?? range;

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="flex h-14 shrink-0 items-center px-4 md:px-8"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Estadísticas</h1>
        <span className="ml-2 text-[11px]" style={{ color: "var(--color-subtle)" }}>TapRain</span>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6 md:px-8">
        {/* Range tabs */}
        <nav
          className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl p-1"
          style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}
        >
          {RANGES.map(({ key, label }) => (
            <Link
              key={key}
              href={`/stats?range=${key}${selected ? `&c=${selected}` : ""}`}
              className="shrink-0 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: range === key ? "var(--color-surface-overlay)" : "transparent",
                color:      range === key ? "var(--color-foreground)" : "var(--color-muted-foreground)",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Selector de campañas (cada usuario ve solo las suyas) */}
        {campaigns.length > 0 && (
          <nav className="flex max-w-full gap-1.5 overflow-x-auto pb-1">
            <Link href={`/stats?range=${range}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ background: !selected ? "var(--color-surface-overlay)" : "transparent", border: `1px solid ${!selected ? "var(--color-border-focus)" : "var(--color-border)"}`, color: !selected ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}>
              Todas
            </Link>
            {campaigns.map((cm) => {
              const on = selected === cm.slug;
              return (
                <Link key={cm.id} href={`/stats?range=${range}&c=${cm.slug}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{ background: on ? "var(--color-surface-overlay)" : "transparent", border: `1px solid ${on ? "var(--color-border-focus)" : "var(--color-border)"}`, color: on ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cm.colorPrimary }} />
                  {cm.name}
                </Link>
              );
            })}
          </nav>
        )}

        {/* API error */}
        {apiError && (
          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: "var(--color-warning-bg)", border: "1px solid rgba(245,166,35,0.2)" }}
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--color-warning)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-warning)" }}>
                Stats API no disponible — mostrando datos locales
              </p>
              <p className="mt-0.5 font-mono text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                {apiError}
              </p>
            </div>
          </div>
        )}

        {/* Refresco periódico → sensación de tiempo real */}
        <AutoRefresh intervalMs={30_000} />

        {/* Metric cards */}
        <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            icon={DollarSign}
            label="Revenue"
            value={<AnimatedNumber value={summary ? summary.revenue : localRevenue} format={fmt.usd} />}
            sub={!summary ? "local" : undefined}
            loaded
          />
          <MetricCard
            icon={Repeat2}
            label="Conversiones"
            value={<AnimatedNumber value={summary?.conversions ?? localCount} format={fmt.int} />}
            sub={!summary ? "local" : undefined}
            loaded
          />
          <MetricCard
            icon={MousePointerClick}
            label="Clicks"
            value={<AnimatedNumber value={summary?.clicks ?? clicks} format={fmt.int} />}
            sub={summary?.clicks == null ? "local" : undefined}
            loaded
          />
          <MetricCard
            icon={Zap}
            label="EPC"
            value={
              summary?.epc != null
                ? <AnimatedNumber value={summary.epc} format={fmt.usd} />
                : clicks > 0
                ? <AnimatedNumber value={localRevenue / clicks} format={fmt.usd} />
                : "—"
            }
            sub={summary?.epc == null && clicks > 0 ? "local" : undefined}
            loaded
          />
        </div>

        {/* Chart — always rendered, built from local conversions */}
        <StatsChart data={chartData} label={`Revenue · ${selectedCampaign ? selectedCampaign.name : rangeLabel}`} />

        {/* Conversions list */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
              Conversiones
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-[11px]"
              style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}
            >
              {localCount}
            </span>
          </div>
          <ConversionList conversions={convList} isAdmin={isAdmin} />
        </div>

        {/* Postback URL helper */}
        {localCount === 0 && (
          <details style={{ color: "var(--color-subtle)" }}>
            <summary className="cursor-pointer select-none text-xs">
              ¿Cómo configurar el postback?
            </summary>
            <div
              className="mt-3 space-y-2 rounded-xl p-4 text-xs"
              style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}
            >
              <p style={{ color: "var(--color-muted-foreground)" }}>
                En TapRain → Global Postback, pegá esta URL:
              </p>
              <code
                className="block overflow-x-auto rounded-md p-3 font-mono"
                style={{ background: "var(--color-surface-overlay)", color: "var(--color-foreground)", border: "1px solid var(--color-border)" }}
              >
                {`${baseUrl}/api/postback?price={price}&offer_name={offer_name}&country={country}&s1={s1}&s2={s2}&click_id={click_id}&conversion_id={conversion_id}&ip={ip}`}
              </code>
            </div>
          </details>
        )}
      </main>
    </div>
  );
}

function MetricCard({
  icon: Icon, label, value, sub, loaded,
}: {
  icon: React.ElementType; label: string; value: React.ReactNode; sub?: string; loaded: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>{label}</p>
        <Icon className="h-3.5 w-3.5" style={{ color: "var(--color-subtle)" }} />
      </div>
      <p
        className="mt-3 text-2xl font-semibold tabular-nums tracking-tight"
        style={{ color: loaded ? "var(--color-foreground)" : "var(--color-subtle)" }}
      >
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-[10px] uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>{sub}</p>
      )}
    </div>
  );
}

const fmt = {
  usd: (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n),
  int: (n: number) => new Intl.NumberFormat("en-US").format(n),
};
