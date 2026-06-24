import { db } from "@/server/db";
import { Trophy, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboard" };

const MOTIVATIONAL = [
  "El único rival que importa sos vos de ayer.",
  "Los mejores no compiten con otros — se superan a sí mismos.",
  "Cada conversión es un paso adelante. Seguí caminando.",
  "La consistencia siempre gana a largo plazo.",
  "Hoy es una nueva oportunidad de batir tu propio récord.",
  "No mirés para el costado — mirá para arriba.",
  "El progreso, aunque pequeño, siempre cuenta.",
];

export default async function LeaderboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000);

  const [todayConvs, yesterdayConvs] = await Promise.all([
    db.conversion.findMany({
      where: { receivedAt: { gte: startOfToday, lte: now } },
      select: { price: true },
    }),
    db.conversion.findMany({
      where: { receivedAt: { gte: startOfYesterday, lt: startOfToday } },
      select: { price: true },
    }),
  ]);

  const todayRevenue    = todayConvs.reduce((s, c) => s + c.price, 0);
  const yesterdayRevenue = yesterdayConvs.reduce((s, c) => s + c.price, 0);
  const todayCount       = todayConvs.length;
  const yesterdayCount   = yesterdayConvs.length;

  const diff        = todayRevenue - yesterdayRevenue;
  const diffPct     = yesterdayRevenue > 0
    ? (diff / yesterdayRevenue) * 100
    : todayRevenue > 0 ? 100 : 0;
  const winning     = todayRevenue >= yesterdayRevenue;
  const identical   = diff === 0 && yesterdayRevenue === 0;

  // Deterministic motivational pick (changes each hour)
  const motivation = MOTIVATIONAL[now.getHours() % MOTIVATIONAL.length]!;

  function fmt(n: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD", minimumFractionDigits: 2,
    }).format(n);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="flex h-14 shrink-0 items-center gap-2 px-8"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <Trophy className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
          Leaderboard
        </h1>
      </header>

      <main className="flex-1 px-8 py-10 flex flex-col items-center">
        {/* Hero motivational */}
        <div className="text-center max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
            Leaderboard
          </p>
          <h2
            className="mt-3 text-2xl font-bold leading-snug"
            style={{ color: "var(--color-foreground)" }}
          >
            ¿Por qué querés compararte
            <br />con otras personas?
          </h2>
          <p
            className="mt-2 text-base font-semibold"
            style={{ color: "var(--color-accent)" }}
          >
            ¡Sé mejor que ayer!
          </p>
        </div>

        {/* Comparison cards */}
        <div className="mt-10 grid w-full max-w-lg grid-cols-2 gap-4">
          {/* Yesterday */}
          <div
            className="rounded-2xl p-6"
            style={{
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-raised)",
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
              Ayer
            </p>
            <p
              className="mt-3 text-3xl font-bold tabular-nums tracking-tight"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              {fmt(yesterdayRevenue)}
            </p>
            <p className="mt-1.5 text-xs" style={{ color: "var(--color-subtle)" }}>
              {yesterdayCount} conversión{yesterdayCount !== 1 ? "es" : ""}
            </p>
          </div>

          {/* Today */}
          <div
            className="rounded-2xl p-6"
            style={{
              border: `1px solid ${winning && !identical ? "rgba(80,227,194,0.3)" : "var(--color-border)"}`,
              background: winning && !identical ? "var(--color-success-bg)" : "var(--color-surface-raised)",
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
              Hoy
            </p>
            <p
              className="mt-3 text-3xl font-bold tabular-nums tracking-tight"
              style={{ color: winning && !identical ? "var(--color-success)" : "var(--color-foreground)" }}
            >
              {fmt(todayRevenue)}
            </p>
            <p className="mt-1.5 text-xs" style={{ color: "var(--color-subtle)" }}>
              {todayCount} conversión{todayCount !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {/* Diff badge */}
        <div className="mt-4 flex items-center gap-2">
          {identical ? (
            <>
              <Minus className="h-4 w-4" style={{ color: "var(--color-subtle)" }} />
              <span className="text-sm" style={{ color: "var(--color-subtle)" }}>
                Sin datos aún — ¡el día acaba de empezar!
              </span>
            </>
          ) : winning ? (
            <>
              <TrendingUp className="h-4 w-4" style={{ color: "var(--color-success)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--color-success)" }}>
                +{fmt(diff)} · +{diffPct.toFixed(1)}% vs ayer
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4" style={{ color: "var(--color-error)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>
                {fmt(diff)} · {diffPct.toFixed(1)}% vs ayer
              </span>
            </>
          )}
        </div>

        {/* Motivational footer card */}
        <div
          className="mt-12 flex w-full max-w-lg items-start gap-3 rounded-2xl p-5"
          style={{
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-raised)",
          }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--color-surface-overlay)" }}
          >
            <Zap className="h-4 w-4" style={{ color: "var(--color-warning)" }} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
              Recordatorio
            </p>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>
              {motivation}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
