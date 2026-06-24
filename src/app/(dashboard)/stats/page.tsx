import Link from "next/link";
import { fetchStats, type StatsRange, type StatsRow } from "@/lib/taprain";
import { DollarSign, Repeat2, MousePointerClick, Zap, AlertTriangle } from "lucide-react";
import { StatsChart, type ChartPoint } from "./_components/stats-chart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stats" };

const RANGES: { key: StatsRange; label: string }[] = [
  { key: "hour",      label: "Última hora" },
  { key: "today",     label: "Hoy" },
  { key: "yesterday", label: "Ayer" },
  { key: "7days",     label: "7 días" },
  { key: "30days",    label: "30 días" },
];

/* Try to extract a time-series from rows regardless of exact key names */
function extractChartData(rows: StatsRow[]): ChartPoint[] {
  if (!rows.length) return [];
  const first = rows[0]!;
  const keys = Object.keys(first);

  const labelKey = keys.find((k) =>
    /date|time|hour|day|period|label/i.test(k),
  );
  const revenueKey = keys.find((k) =>
    /revenue|payout|earning|amount/i.test(k),
  );
  const convKey = keys.find((k) =>
    /conversion|conv|count/i.test(k),
  );

  if (!revenueKey) return [];

  return rows.map((row) => ({
    label: labelKey ? String(row[labelKey] ?? "") : "",
    revenue: Number(row[revenueKey] ?? 0),
    conversions: convKey && row[convKey] != null ? Number(row[convKey]) : undefined,
  }));
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange = "today" } = await searchParams;
  const range = (RANGES.some((r) => r.key === rawRange) ? rawRange : "today") as StatsRange;

  let data: Awaited<ReturnType<typeof fetchStats>> | null = null;
  let apiError: string | null = null;

  try {
    data = await fetchStats(range);
  } catch (e) {
    apiError = e instanceof Error ? e.message : "Error desconocido";
  }

  const summary = data?.summary;
  const rows = data?.rows ?? [];
  const chartData = extractChartData(rows);

  // Detect extra table columns
  const rowKeys = rows.length > 0 ? Object.keys(rows[0]!) : [];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header
        className="flex h-14 shrink-0 items-center px-8"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
          Stats
        </h1>
        <span className="ml-2 text-[11px]" style={{ color: "var(--color-subtle)" }}>
          TapRain
        </span>
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
                color: range === key ? "var(--color-foreground)" : "var(--color-muted-foreground)",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Error */}
        {apiError && (
          <div
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: "var(--color-warning-bg)", border: "1px solid rgba(245,166,35,0.2)" }}
          >
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-warning)" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-warning)" }}>
                No se pudo cargar los stats
              </p>
              <p className="mt-0.5 font-mono text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                {apiError}
              </p>
            </div>
          </div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard icon={DollarSign}        label="Revenue"       value={summary ? fmt.usd(summary.revenue) : "—"} loaded={!!data} />
          <MetricCard icon={Repeat2}           label="Conversiones"  value={summary?.conversions != null ? fmt.int(summary.conversions) : "—"} loaded={!!data} />
          <MetricCard icon={MousePointerClick} label="Clicks"        value={summary?.clicks != null ? fmt.int(summary.clicks) : "—"} loaded={!!data} />
          <MetricCard
            icon={Zap}
            label="EPC"
            value={
              summary?.epc != null
                ? fmt.usd(summary.epc)
                : summary?.revenue != null && summary?.clicks
                ? fmt.usd(summary.revenue / summary.clicks)
                : "—"
            }
            loaded={!!data}
          />
        </div>

        {/* Chart */}
        {!apiError && (
          <StatsChart data={chartData} label={`Revenue — ${RANGES.find((r) => r.key === range)?.label}`} />
        )}

        {/* Breakdown table */}
        {rows.length > 0 && rowKeys.length > 0 && (
          <div
            className="overflow-hidden rounded-xl"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>
                Desglose
              </p>
            </div>
            <div style={{ background: "var(--color-surface)" }}>
              <div
                className="grid px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider"
                style={{
                  color: "var(--color-muted-foreground)",
                  borderBottom: "1px solid var(--color-border)",
                  gridTemplateColumns: `repeat(${rowKeys.length}, 1fr)`,
                }}
              >
                {rowKeys.map((k) => <span key={k}>{k}</span>)}
              </div>
              {rows.map((row, i) => (
                <div
                  key={i}
                  className="grid px-4 py-3 text-sm"
                  style={{
                    gridTemplateColumns: `repeat(${rowKeys.length}, 1fr)`,
                    borderBottom: i < rows.length - 1 ? "1px solid var(--color-border)" : "none",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  {rowKeys.map((k) => {
                    const val = row[k];
                    const isRev = /revenue|payout|earning/i.test(k);
                    return (
                      <span key={k} style={{ color: isRev ? "var(--color-foreground)" : undefined }}>
                        {val == null ? "—" : isRev && typeof val === "number" ? fmt.usd(val) : String(val)}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw response (dev helper when no breakdown rows) */}
        {data && rows.length === 0 && (
          <details className="text-xs" style={{ color: "var(--color-subtle)" }}>
            <summary className="cursor-pointer select-none">Raw API response</summary>
            <pre
              className="mt-2 overflow-x-auto rounded-lg p-4 font-mono text-[11px]"
              style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        )}
      </main>
    </div>
  );
}

/* ── Metric card ── */
function MetricCard({
  icon: Icon,
  label,
  value,
  loaded,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  loaded: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
          {label}
        </p>
        <Icon className="h-3.5 w-3.5" style={{ color: "var(--color-subtle)" }} />
      </div>
      <p
        className="mt-3 text-2xl font-semibold tabular-nums tracking-tight"
        style={{ color: loaded ? "var(--color-foreground)" : "var(--color-subtle)" }}
      >
        {value}
      </p>
    </div>
  );
}

const fmt = {
  usd: (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n),
  int: (n: number) => new Intl.NumberFormat("en-US").format(n),
};
