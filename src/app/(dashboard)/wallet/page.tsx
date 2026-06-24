import { Wallet, ArrowDownToLine, Clock } from "lucide-react";

export const metadata = { title: "Wallet" };

export default function WalletPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="flex h-14 shrink-0 items-center gap-2 px-8"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <Wallet className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
          Wallet
        </h1>
      </header>

      <main className="flex-1 px-8 py-12 flex flex-col items-center">

        {/* Balance card */}
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center"
          style={{
            border:     "1px solid var(--color-border)",
            background: "var(--color-surface-raised)",
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-subtle)" }}
          >
            Balance disponible
          </p>
          <p
            className="mt-4 text-5xl font-bold tabular-nums tracking-tight"
            style={{ color: "var(--color-foreground)" }}
          >
            $0.00
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--color-subtle)" }}>
            USD · actualizado en tiempo real
          </p>

          <button
            type="button"
            disabled
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-40"
            style={{
              background: "var(--color-foreground)",
              color:      "var(--color-background)",
            }}
          >
            <ArrowDownToLine className="h-4 w-4" />
            Retirar fondos
          </button>
        </div>

        {/* Pending notice */}
        <div
          className="mt-6 flex w-full max-w-sm items-start gap-3 rounded-xl p-4"
          style={{
            border:     "1px solid var(--color-border)",
            background: "var(--color-surface-raised)",
          }}
        >
          <Clock className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>
              Sistema de pagos en construcción
            </p>
            <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
              Pronto vas a poder ver tu balance en tiempo real y solicitar retiros. La lógica de liquidación se define próximamente.
            </p>
          </div>
        </div>

        {/* Empty history */}
        <div className="mt-8 w-full max-w-sm">
          <p
            className="mb-3 text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-subtle)" }}
          >
            Historial de pagos
          </p>
          <div
            className="rounded-xl py-10 text-center"
            style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
          >
            <p className="text-sm" style={{ color: "var(--color-subtle)" }}>
              Sin movimientos todavía.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
