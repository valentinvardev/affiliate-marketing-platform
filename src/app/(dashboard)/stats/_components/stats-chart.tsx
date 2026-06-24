"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type ChartPoint = {
  label: string;
  revenue: number;
  conversions?: number;
};

const VIOLET = "#a78bfa";

type TooltipEntry = { dataKey?: string | number; value?: number | string };
type CustomTooltipProps = { active?: boolean; payload?: TooltipEntry[]; label?: string };

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#111",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginBottom: 6 }}>
        {label}
      </p>
      {payload.map((entry, i) => (
        <p
          key={i}
          style={{ color: "#fff", fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}
        >
          {entry.dataKey === "revenue"
            ? `$${Number(entry.value ?? 0).toFixed(2)}`
            : `${entry.value} conv.`}
        </p>
      ))}
    </div>
  );
}

export function StatsChart({ data, label = "Revenue" }: { data: ChartPoint[]; label?: string }) {
  if (data.length === 0) {
    return (
      <div
        className="flex h-56 items-center justify-center rounded-xl"
        style={{ border: "1px solid rgba(255,255,255,0.06)", background: "var(--color-surface-raised)" }}
      >
        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
          Sin datos de desglose para este rango
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl px-6 pt-5 pb-3"
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        background: "var(--color-surface-raised)",
      }}
    >
      <p
        className="mb-5 text-[11px] font-semibold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        {label}
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={VIOLET} stopOpacity={0.3} />
              <stop offset="100%" stopColor={VIOLET} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="0"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />

          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${v % 1 === 0 ? v : v.toFixed(1)}`}
            width={48}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke={VIOLET}
            strokeWidth={2}
            fill="url(#revGrad)"
            dot={false}
            activeDot={{ r: 4, fill: VIOLET, stroke: "rgba(167,139,250,0.3)", strokeWidth: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
