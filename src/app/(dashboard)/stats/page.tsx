import Link from "next/link";
import { db } from "@/server/db";
import { fetchStats, type StatsRange } from "@/lib/taprain";
import { DollarSign, Repeat2, MousePointerClick, Zap, AlertTriangle } from "lucide-react";
import { StatsChart, type ChartPoint } from "./_components/stats-chart";
import { ConversionList } from "./_components/conversion-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stats" };

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
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange = "today" } = await searchParams;
  const range = (RANGES.some((r) => r.key === rawRange) ? rawRange : "today") as StatsRange;
  const window = getWindow(range);

  // Fetch TapRain summary stats + local conversions in parallel
  const [statsResult, conversions] = await Promise.allSettled([
    fetchStats(range),
    db.conversion.findMany({
      where: { receivedAt: { gte: window.from, lte: window.to } },
      orderBy: { receivedAt: "desc" },
    }),
  ]);

  const data    = statsResult.status === "fulfilled" ? statsResult.value : null;
  const apiError = statsResult.status === "rejected"
    ? (statsResult.reason instanceof Error ? statsResult.reason.message : "Error desconocido")
    : null;

  const convList = conversions.status === "fulfilled" ? conversions.value : [];
  const chartData = buildChartData(convList, range, window);

  // Local summary (fallback / supplement when API has no clicks data)
  const localRevenue = convList.reduce((s, c) => s + c.price, 0);
  const localCount   = convList.length;

  const summary = data?.summary;
  const rangeLabel = RANGES.find((r) => r.key === range)?.label ?? range;

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="flex h-14 shrink-0 items-center px-8"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Stats</h1>
        <span className="ml-2 text-[11px]" style={{ color: "var(--color-subtle)" }}>TapRain</span>
      </header>

      <main className="flex-1 px-8 py-6 space-y-6">
        {/* Range tabs */}
        <nav
          className="flex gap-1 rounded-xl p-1 w-fit"
          style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}
        >
          {RANGES.map(({ key, label }) => (
            <Link
              key={key}
              href={`/stats?range=${key}`}
              className="rounded-lg px-4 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: range === key ? "var(--color-surface-overlay)" : "transparent",
                color:      range === key ? "var(--color-foreground)" : "var(--color-muted-foreground)",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

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

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            icon={DollarSign}
            label="Revenue"
            value={summary ? fmt.usd(summary.revenue) : fmt.usd(localRevenue)}
            sub={!summary ? "local" : undefined}
            loaded
          />
          <MetricCard
            icon={Repeat2}
            label="Conversiones"
            value={summary?.conversions != null ? fmt.int(summary.conversions) : fmt.int(localCount)}
            sub={!summary ? "local" : undefined}
            loaded
          />
          <MetricCard
            icon={MousePointerClick}
            label="Clicks"
            value={summary?.clicks != null ? fmt.int(summary.clicks) : "—"}
            loaded={!!summary}
          />
          <MetricCard
            icon={Zap}
            label="EPC"
            value={
              summary?.epc != null
                ? fmt.usd(summary.epc)
                : summary?.clicks && summary.revenue
                ? fmt.usd(summary.revenue / summary.clicks)
                : "—"
            }
            loaded={!!summary}
          />
        </div>

        {/* Chart — always rendered, built from local conversions */}
        <StatsChart data={chartData} label={`Revenue · ${rangeLabel}`} />

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
          <ConversionList conversions={convList} />
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
                {`https://TU_DOMINIO.vercel.app/api/postback?price={price}&offer_name={offer_name}&country={country}&s1={s1}&s2={s2}&click_id={click_id}&conversion_id={conversion_id}&ip={ip}`}
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
  icon: React.ElementType; label: string; value: string; sub?: string; loaded: boolean;
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
