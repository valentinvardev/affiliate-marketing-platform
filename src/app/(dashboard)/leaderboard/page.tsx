import { db } from "@/server/db";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

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

  const [todayAgg, yesterdayAgg] = await Promise.all([
    db.conversion.aggregate({
      where: { receivedAt: { gte: startOfToday } },
      _sum: { price: true }, _count: { id: true },
    }),
    db.conversion.aggregate({
      where: { receivedAt: { gte: startOfYesterday, lt: startOfToday } },
      _sum: { price: true }, _count: { id: true },
    }),
  ]);

  const todayRevenue     = todayAgg._sum.price     ?? 0;
  const yesterdayRevenue = yesterdayAgg._sum.price ?? 0;
  const todayCount       = todayAgg._count.id;
  const yesterdayCount   = yesterdayAgg._count.id;

  const diff    = todayRevenue - yesterdayRevenue;
  const diffPct = yesterdayRevenue > 0
    ? (diff / yesterdayRevenue) * 100
    : todayRevenue > 0 ? 100 : 0;
  const ahead   = diff > 0;
  const behind  = diff < 0;
  const noData  = diff === 0 && yesterdayRevenue === 0;

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

      <main className="flex-1 px-8 py-16 flex flex-col items-center">

        {/* Headline */}
        <div className="text-center max-w-sm">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-subtle)" }}
          >
            Tu progreso
          </p>
          <h2
            className="mt-4 text-3xl font-bold tracking-tight"
            style={{ color: "var(--color-foreground)" }}
          >
            ¿Por qué compararte
            <br />con otras personas?
          </h2>
          <p className="mt-3 text-base" style={{ color: "var(--color-muted-foreground)" }}>
            Sé mejor que ayer.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-12 grid w-full max-w-lg grid-cols-2 gap-3">
          {/* Yesterday */}
          <div
            className="rounded-xl p-6"
            style={{
              border:     "1px solid var(--color-border)",
              background: "var(--color-surface-raised)",
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-subtle)" }}
            >
              Ayer
            </p>
            <p
              className="mt-4 text-3xl font-bold tabular-nums tracking-tight"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              {fmt(yesterdayRevenue)}
            </p>
            <p className="mt-2 text-xs" style={{ color: "var(--color-subtle)" }}>
              {yesterdayCount} conversión{yesterdayCount !== 1 ? "es" : ""}
            </p>
          </div>

          {/* Today */}
          <div
            className="rounded-xl p-6"
            style={{
              border:     ahead ? "1px solid rgba(255,255,255,0.15)" : "1px solid var(--color-border)",
              background: ahead ? "var(--color-surface-overlay)"      : "var(--color-surface-raised)",
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-subtle)" }}
            >
              Hoy
            </p>
            <p
              className="mt-4 text-3xl font-bold tabular-nums tracking-tight"
              style={{ color: "var(--color-foreground)" }}
            >
              {fmt(todayRevenue)}
            </p>
            <p className="mt-2 text-xs" style={{ color: "var(--color-subtle)" }}>
              {todayCount} conversión{todayCount !== 1 ? "es" : ""}
            </p>
          </div>
        </div>

        {/* Diff badge */}
        <div className="mt-5">
          {noData ? (
            <span className="text-sm" style={{ color: "var(--color-subtle)" }}>
              Sin datos aún — el día acaba de empezar.
            </span>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tabular-nums"
              style={{
                background: "var(--color-surface-overlay)",
                border:     "1px solid var(--color-border)",
                color:      "var(--color-foreground)",
              }}
            >
              {ahead  && <TrendingUp   className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />}
              {behind && <TrendingDown className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />}
              {!ahead && !behind && <Minus className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />}
              {diff >= 0 ? "+" : ""}{fmt(diff)}
              <span style={{ color: "var(--color-subtle)" }}>
                ({diff >= 0 ? "+" : ""}{diffPct.toFixed(1)}% vs ayer)
              </span>
            </div>
          )}
        </div>

        {/* Motivational quote */}
        <div
          className="mt-16 w-full max-w-lg"
          style={{ borderLeft: "2px solid var(--color-border)", paddingLeft: 20 }}
        >
          <p
            className="text-sm leading-relaxed italic"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            &ldquo;{motivation}&rdquo;
          </p>
          <p
            className="mt-2 text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-subtle)" }}
          >
            Recordatorio diario
          </p>
        </div>

      </main>
    </div>
  );
}
