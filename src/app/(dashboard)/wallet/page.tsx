import { db } from "@/server/db";
import { Wallet, ArrowDownToLine, Clock, HardHat } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wallet" };

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", minimumFractionDigits: 2,
});

export default async function WalletPage() {
  // Conectado a los fondos reales (suma de todas las conversiones)
  const agg = await db.conversion.aggregate({ _sum: { price: true }, _count: { id: true } });
  const balance = agg._sum.price ?? 0;
  const count   = agg._count.id;

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="flex h-14 shrink-0 items-center gap-2 px-4 md:px-8"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <Wallet className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
          Wallet
        </h1>
      </header>

      <main className="relative flex-1 px-4 py-12 md:px-8">
        {/* ── Contenido real, difuminado ── */}
        <div
          className="flex flex-col items-center"
          style={{ filter: "blur(7px)", pointerEvents: "none", userSelect: "none" }}
          aria-hidden
        >
          {/* Balance card */}
          <div
            className="w-full max-w-sm rounded-2xl p-8 text-center"
            style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
              Balance disponible
            </p>
            <p className="mt-4 text-5xl font-bold tabular-nums tracking-tight" style={{ color: "var(--color-foreground)" }}>
              {fmt.format(balance)}
            </p>
            <p className="mt-2 text-xs" style={{ color: "var(--color-subtle)" }}>
              USD · {count} conversion{count !== 1 ? "es" : ""}
            </p>

            <button
              type="button"
              disabled
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-40"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
            >
              <ArrowDownToLine className="h-4 w-4" />
              Retirar fondos
            </button>
          </div>

          {/* Pending notice */}
          <div
            className="mt-6 flex w-full max-w-sm items-start gap-3 rounded-xl p-4"
            style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
          >
            <Clock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--color-subtle)" }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>
                Sistema de pagos
              </p>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
                Balance en tiempo real y retiros. La lógica de liquidación se define próximamente.
              </p>
            </div>
          </div>

          {/* History */}
          <div className="mt-8 w-full max-w-sm">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
              Historial de pagos
            </p>
            <div
              className="rounded-xl py-10 text-center"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
            >
              <p className="text-sm" style={{ color: "var(--color-subtle)" }}>Sin movimientos todavía.</p>
            </div>
          </div>
        </div>

        {/* ── Overlay "En construcción" ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}
          >
            <HardHat className="h-6 w-6" style={{ color: "var(--color-warning)" }} />
          </div>
          <h2 className="mt-4 text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
            En construcción
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
            Tu billetera ya está conectada a tus fondos. Estamos terminando los retiros y el historial — muy pronto disponible.
          </p>
        </div>
      </main>
    </div>
  );
}
