"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, MessageCircle } from "lucide-react";

type BalanceData = {
  today:     { revenue: number; conversions: number };
  yesterday: { revenue: number; conversions: number };
};

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", minimumFractionDigits: 2,
});

export function BalanceBar() {
  const [data, setData]       = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/stats/balance");
      if (res.ok) setData(await res.json() as BalanceData);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  const diff    = data ? data.today.revenue - data.yesterday.revenue : 0;
  const ahead   = diff >= 0;
  const noData  = !data || (data.today.revenue === 0 && data.yesterday.revenue === 0);

  return (
    <div
      className="flex shrink-0 items-center gap-6 px-8"
      style={{
        height:       42,
        borderBottom: "1px solid var(--color-border)",
        background:   "var(--color-surface)",
      }}
    >
      <div className="flex-1" />
      {loading ? (
        <span className="text-xs" style={{ color: "var(--color-subtle)" }}>
          Cargando balance…
        </span>
      ) : (
        <>
          {/* Yesterday */}
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
              Ayer
            </span>
            <span
              className="text-xs font-medium tabular-nums"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              {fmt.format(data?.yesterday.revenue ?? 0)}
            </span>
            <span
              className="text-[10px]"
              style={{ color: "var(--color-subtle)" }}
            >
              · {data?.yesterday.conversions ?? 0} conv
            </span>
          </div>

          <div style={{ width: 1, height: 16, background: "var(--color-border)" }} />

          {/* Today */}
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
              Hoy
            </span>
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ color: "var(--color-foreground)" }}
            >
              {fmt.format(data?.today.revenue ?? 0)}
            </span>
            <span
              className="text-[10px]"
              style={{ color: "var(--color-subtle)" }}
            >
              · {data?.today.conversions ?? 0} conv
            </span>
          </div>

          {/* Diff badge */}
          {!noData && (
            <div
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
              style={{
                background: ahead
                  ? "var(--color-success-bg)"
                  : "var(--color-error-bg)",
                color: ahead ? "var(--color-success)" : "var(--color-error)",
              }}
            >
              {diff === 0
                ? <Minus className="h-3 w-3" />
                : ahead
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />
              }
              {diff >= 0 ? "+" : ""}{fmt.format(diff)} vs ayer
            </div>
          )}
        </>
      )}

      {/* Chat button */}
      <div style={{ width: 1, height: 16, background: "var(--color-border)", flexShrink: 0 }} />
      <button
        type="button"
        title="Chat en vivo"
        onClick={() => window.dispatchEvent(new CustomEvent("chat:open"))}
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-70"
        style={{
          background: "var(--color-surface-overlay)",
          border:     "1px solid var(--color-border)",
          color:      "var(--color-muted-foreground)",
        }}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Chat
      </button>
    </div>
  );
}
