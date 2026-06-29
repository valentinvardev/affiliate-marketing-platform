import { ConversionReassign } from "./conversion-reassign";

type Conversion = {
  id: string;
  price: number;
  offerName: string | null;
  country: string | null;
  s1: string | null;
  s2: string | null;
  clickId: string | null;
  conversionId: string | null;
  ip: string | null;
  receivedAt: Date;
};

export function ConversionList({ conversions, isAdmin = false }: { conversions: Conversion[]; isAdmin?: boolean }) {
  const cols = isAdmin ? "1fr 80px 60px 100px 120px 40px" : "1fr 80px 60px 100px 120px";
  if (conversions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl py-16"
        style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
      >
        <p className="text-sm" style={{ color: "var(--color-subtle)" }}>
          Sin conversiones en este período
        </p>
        <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
          Configura el Global Postback en TapRain para empezar a recibir datos
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)" }}>
      {/* Head (solo desktop) */}
      <div
        className="hidden px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider md:grid"
        style={{
          color: "var(--color-muted-foreground)",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface-raised)",
          gridTemplateColumns: cols,
        }}
      >
        <span>Oferta</span>
        <span>Pago</span>
        <span>País</span>
        <span>Campaña (s1)</span>
        <span className="text-right">Recibido</span>
        {isAdmin && <span />}
      </div>

      {/* Rows */}
      <div style={{ background: "var(--color-surface)" }}>
        {conversions.map((c, i) => {
          const border = i < conversions.length - 1 ? "1px solid var(--color-border)" : "none";
          return (
            <div key={c.id}>
              {/* Desktop: fila de tabla */}
              <div
                className="hidden items-center px-4 py-3 text-sm md:grid"
                style={{ gridTemplateColumns: cols, borderBottom: border }}
              >
                <span className="truncate font-medium pr-4" style={{ color: "var(--color-foreground)" }}>
                  {c.offerName ?? <span style={{ color: "var(--color-subtle)" }}>—</span>}
                </span>
                <span className="tabular-nums font-semibold" style={{ color: "#a78bfa" }}>
                  ${c.price.toFixed(2)}
                </span>
                <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  {c.country ?? "—"}
                </span>
                <span className="truncate text-xs font-mono" style={{ color: "var(--color-muted-foreground)" }}>
                  {c.s1 ?? <span style={{ color: "var(--color-subtle)" }}>—</span>}
                </span>
                <span className="text-right text-xs" style={{ color: "var(--color-subtle)" }}>
                  {relativeTime(c.receivedAt)}
                </span>
                {isAdmin && (
                  <span className="flex justify-end">
                    <ConversionReassign id={c.id} currentS1={c.s1} offerName={c.offerName} />
                  </span>
                )}
              </div>

              {/* Móvil: card */}
              <div className="flex flex-col gap-1.5 px-4 py-3 md:hidden" style={{ borderBottom: border }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                    {c.offerName ?? <span style={{ color: "var(--color-subtle)" }}>Sin oferta</span>}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="tabular-nums text-sm font-semibold" style={{ color: "#a78bfa" }}>
                      ${c.price.toFixed(2)}
                    </span>
                    {isAdmin && <ConversionReassign id={c.id} currentS1={c.s1} offerName={c.offerName} />}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs" style={{ color: "var(--color-subtle)" }}>
                  <span>{c.country ?? "—"}</span>
                  <span>·</span>
                  <span className="truncate font-mono" style={{ color: "var(--color-muted-foreground)", maxWidth: "55%" }}>
                    {c.s1 ?? "—"}
                  </span>
                  <span>·</span>
                  <span>{relativeTime(c.receivedAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function relativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}
