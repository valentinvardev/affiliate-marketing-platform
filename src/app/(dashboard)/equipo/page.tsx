"use client";

import { api } from "@/trpc/react";
import { Loader2, Users, TrendingUp } from "lucide-react";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export default function EquipoPage() {
  const q = api.accounting.myCommissions.useQuery();
  const rows = q.data ?? [];
  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <header className="flex h-14 items-center gap-3 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Users className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Mi equipo</h1>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">
        {/* Total */}
        <div className="mb-5 rounded-xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>Tu comisión total</p>
          <p className="mt-1 text-3xl font-bold tabular-nums" style={{ color: "var(--color-success)" }}>{money(total)}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            Suma de tu % sobre el (revenue − VCC) de cada persona a tu cargo.
          </p>
        </div>

        {q.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
            <Users className="mx-auto h-8 w-8" style={{ color: "var(--color-subtle)" }} />
            <p className="mt-3 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Todavía no tenés gente a cargo</p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              El admin te asigna un % en el reparto de cada persona desde Admin → Distribuciones.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
              Gente a cargo ({rows.length})
            </p>
            {rows.map((r) => (
              <div key={r.sourceUserId} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ background: "var(--color-surface-overlay)", color: "var(--color-foreground)" }}>
                  {r.sourceName[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{r.sourceName}</p>
                  <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
                    base {money(r.base)} · tu {r.percent}%
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" style={{ color: "var(--color-success)" }} />
                  <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-success)" }}>{money(r.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
