import Link from "next/link";
import { getServerSession } from "next-auth";
import ReactCountryFlag from "react-country-flag";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";
import { getLocaleByCode } from "@/lib/locales";
import { getScope, convWhere, campaignWhere } from "@/lib/scope";
import {
  TrendingUp, TrendingDown, ArrowUpRight, LayoutGrid, Heart, Wallet,
  Package, MessageCircle, Trophy, Activity,
} from "lucide-react";
import { LiveClock, OpenChatButton } from "./_components/overview-bits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inicio" };

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

function greeting(h: number) {
  if (h < 6)  return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function relTime(date: Date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/* Sparkline SVG (área + línea) a partir de 24 buckets horarios */
function Sparkline({ data }: { data: number[] }) {
  const W = 520, H = 120, P = 4;
  const max = Math.max(...data, 1);
  const n = data.length;
  const x = (i: number) => P + (i / (n - 1)) * (W - P * 2);
  const y = (v: number) => H - P - (v / max) * (H - P * 2);
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${x(n - 1).toFixed(1)} ${H} L ${x(0).toFixed(1)} ${H} Z`;
  const lastX = x(n - 1), lastY = y(data[n - 1] ?? 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full" style={{ display: "block" }}>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#50e3c2" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#50e3c2" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={line} fill="none" stroke="#50e3c2" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lastX} cy={lastY} r="2.5" fill="#50e3c2" />
    </svg>
  );
}

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name ?? "afiliado";

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday.getTime() - 86_400_000);

  let todayConvs: { price: number; receivedAt: Date }[] = [];
  let yRevenue = 0, yCount = 0;
  let campaigns: { id: string; name: string; slug: string; isActive: boolean; colorPrimary: string; locale: string }[] = [];
  let totalFunds = 0;
  let recent: { id: string; price: number; offerName: string | null; country: string | null; receivedAt: Date }[] = [];
  let dbError = false;

  const { slugs, isAdmin, userId } = await getScope();
  const scope = convWhere(slugs);

  try {
    const [tc, yAgg, camps, totalAgg, rec] = await Promise.all([
      db.conversion.findMany({ where: { ...scope, receivedAt: { gte: startToday } }, select: { price: true, receivedAt: true } }),
      db.conversion.aggregate({ where: { ...scope, receivedAt: { gte: startYesterday, lt: startToday } }, _sum: { price: true }, _count: { id: true } }),
      db.campaign.findMany({ where: campaignWhere(isAdmin, userId), orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, isActive: true, colorPrimary: true, locale: true } }),
      db.conversion.aggregate({ where: scope, _sum: { price: true } }),
      db.conversion.findMany({ where: scope, orderBy: { receivedAt: "desc" }, take: 6, select: { id: true, price: true, offerName: true, country: true, receivedAt: true } }),
    ]);
    todayConvs = tc;
    yRevenue = yAgg._sum.price ?? 0;
    yCount = yAgg._count.id;
    campaigns = camps;
    totalFunds = totalAgg._sum.price ?? 0;
    recent = rec;
  } catch {
    dbError = true;
  }

  const todayRevenue = todayConvs.reduce((s, c) => s + c.price, 0);
  const todayCount = todayConvs.length;
  const delta = todayRevenue - yRevenue;
  const pct = yRevenue > 0 ? (delta / yRevenue) * 100 : todayRevenue > 0 ? 100 : 0;
  const up = delta >= 0;

  // 24 hourly buckets
  const hourly = Array.from({ length: 24 }, () => 0);
  for (const c of todayConvs) hourly[new Date(c.receivedAt).getHours()]! += c.price;

  const activeCampaigns = campaigns.filter((c) => c.isActive).length;
  const topCampaigns = campaigns.slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Greeting bar */}
      <header
        className="flex h-14 shrink-0 items-center justify-between gap-3 px-4 md:px-8"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-baseline gap-2 min-w-0">
          <h1 className="truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
            {greeting(now.getHours())}, <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700 }}>{name}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px] tabular-nums" style={{ color: "var(--color-subtle)" }}>
          <span className="hidden sm:inline">{now.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" })}</span>
          <span className="hidden sm:inline" style={{ color: "var(--color-border)" }}>·</span>
          <LiveClock />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-5xl space-y-4">

          {dbError && (
            <div className="rounded-xl p-4 text-sm" style={{ background: "var(--color-warning-bg)", border: "1px solid rgba(245,166,35,0.2)", color: "var(--color-warning)" }}>
              No se pudo conectar a la base de datos.
            </div>
          )}

          {/* ── HERO: ingresos en vivo (firma) ── */}
          <section
            className="relative overflow-hidden rounded-2xl"
            style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
          >
            {/* glow */}
            <div
              className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)" }}
            />
            <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_1.1fr] md:p-8">
              {/* Left: number */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-success)", boxShadow: "0 0 8px var(--color-success)", animation: "ovPulse 2s ease-in-out infinite" }} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-subtle)" }}>
                    Ingresos · hoy
                  </span>
                </div>
                <p
                  className="mt-3 tabular-nums leading-none"
                  style={{ fontFamily: "var(--font-brand)", fontWeight: 900, fontSize: "clamp(2.75rem, 7vw, 4.25rem)", letterSpacing: "-0.03em", color: "var(--color-foreground)" }}
                >
                  {usd(todayRevenue)}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
                    style={{
                      background: up ? "var(--color-success-bg)" : "var(--color-error-bg)",
                      color: up ? "var(--color-success)" : "var(--color-error)",
                      border: `1px solid ${up ? "color-mix(in oklch, var(--color-success) 30%, transparent)" : "color-mix(in oklch, var(--color-error) 30%, transparent)"}`,
                    }}
                  >
                    {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {delta >= 0 ? "+" : ""}{pct.toFixed(1)}%
                  </span>
                  <span className="text-xs" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}>
                    {todayCount} conv · ayer {usd(yRevenue)} ({yCount})
                  </span>
                </div>
              </div>

              {/* Right: sparkline */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-subtle)" }}>
                    Hora a hora
                  </span>
                  <Link href="/stats" className="inline-flex items-center gap-1 text-[11px] transition-opacity hover:opacity-70" style={{ color: "var(--color-muted-foreground)" }}>
                    Ver stats <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="mt-3 flex-1" style={{ minHeight: 120 }}>
                  <Sparkline data={hourly} />
                </div>
                <div className="mt-1 flex justify-between text-[9px] tabular-nums" style={{ color: "var(--color-subtle)", fontFamily: "var(--font-mono)" }}>
                  <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Quick tiles ── */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile href="/campaigns" icon={LayoutGrid} label="Campañas" value={`${activeCampaigns}`} sub={`de ${campaigns.length} activas`} />
            <Tile href="/wallet" icon={Wallet} label="Balance" value={usd(totalFunds)} sub="acumulado" mono />
            <Tile href="/interactions" icon={Heart} label="Interacciones" value="Gestionar" sub="likes · coments · saves" small />
            <Tile href="/offers" icon={Package} label="Ofertas" value="Explorar" sub="catálogo TapRain" small />
          </section>

          {/* ── Bottom: actividad + atajos ── */}
          <section className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            {/* Actividad reciente */}
            <div className="rounded-2xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-subtle)" }}>
                  Actividad reciente
                </span>
              </div>
              {recent.length === 0 ? (
                <p className="py-6 text-center text-sm" style={{ color: "var(--color-subtle)" }}>
                  Sin conversiones todavía.
                </p>
              ) : (
                <div className="space-y-1">
                  {recent.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--color-success)" }} />
                      <span className="flex-1 truncate text-sm" style={{ color: "var(--color-foreground)" }}>
                        {c.offerName ?? "Conversión"}
                      </span>
                      {c.country && <ReactCountryFlag countryCode={c.country} svg style={{ width: "1.1em", height: "0.85em", borderRadius: 2 }} />}
                      <span className="shrink-0 tabular-nums text-sm font-semibold" style={{ color: "var(--color-success)", fontFamily: "var(--font-mono)" }}>
                        +{c.price.toFixed(2)}
                      </span>
                      <span className="w-8 shrink-0 text-right text-[11px] tabular-nums" style={{ color: "var(--color-subtle)", fontFamily: "var(--font-mono)" }}>
                        {relTime(c.receivedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Atajos: campañas top + chat + leaderboard */}
            <div className="flex flex-col gap-3">
              {/* Top campañas */}
              <div className="rounded-2xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-subtle)" }}>Campañas</span>
                  <Link href="/campaigns" className="text-[11px] transition-opacity hover:opacity-70" style={{ color: "var(--color-muted-foreground)" }}>Todas</Link>
                </div>
                {topCampaigns.length === 0 ? (
                  <Link href="/campaigns/new" className="block py-2 text-sm" style={{ color: "var(--color-muted-foreground)" }}>+ Crear la primera</Link>
                ) : (
                  <div className="space-y-2">
                    {topCampaigns.map((c) => {
                      const loc = getLocaleByCode(c.locale);
                      return (
                        <Link key={c.id} href={`/campaigns/${c.id}`} className="flex items-center gap-2.5 transition-opacity hover:opacity-70">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.colorPrimary }} />
                          <span className="flex-1 truncate text-sm" style={{ color: "var(--color-foreground)" }}>{c.name}</span>
                          {loc?.countryCode ? (
                            <ReactCountryFlag countryCode={loc.countryCode} svg style={{ width: "1.15em", height: "0.85em", borderRadius: 2 }} title={loc.label} />
                          ) : (
                            <span className="shrink-0 text-[11px]" style={{ color: "var(--color-subtle)" }}>🌐</span>
                          )}
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c.isActive ? "var(--color-success)" : "var(--color-subtle)" }} />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Chat + leaderboard */}
              <div className="grid grid-cols-2 gap-3">
                <OpenChatButton
                  className="flex flex-col items-start gap-2 rounded-2xl p-4 text-left transition-colors"
                  style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
                >
                  <MessageCircle className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>Abrir chat</span>
                  <span className="text-[10px]" style={{ color: "var(--color-subtle)" }}>Canal general</span>
                </OpenChatButton>
                <Link
                  href="/leaderboard"
                  className="flex flex-col items-start gap-2 rounded-2xl p-4 transition-colors"
                  style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
                >
                  <Trophy className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--color-foreground)" }}>Leaderboard</span>
                  <span className="text-[10px]" style={{ color: "var(--color-subtle)" }}>Sé mejor que ayer</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style>{`
        @keyframes ovPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>
    </div>
  );
}

/* ── Quick tile ── */
function Tile({
  href, icon: Icon, label, value, sub, mono, small,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl p-4 transition-colors"
      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
    >
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--color-subtle)" }} />
      </div>
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-subtle)" }}>
        {label}
      </p>
      <p
        className={`mt-1 ${small ? "text-base" : "text-2xl"} font-bold tracking-tight`}
        style={{
          color: "var(--color-foreground)",
          fontFamily: mono ? "var(--font-mono)" : "var(--font-brand)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11px]" style={{ color: "var(--color-subtle)" }}>{sub}</p>
    </Link>
  );
}
