"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, Coins, Plus, Trash2, Check, AlertCircle, Pencil } from "lucide-react";

type EditRow = { beneficiaryUserId: string; percent: string };

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

export function AdminDistributionTab() {
  const utils = api.useUtils();
  const usersQ = api.admin.users.useQuery();
  const summaryQ = api.accounting.summary.useQuery();
  const setSplit = api.accounting.setSplit.useMutation({
    onSuccess: () => { setEditing(null); void utils.accounting.summary.invalidate(); },
  });

  const [editing, setEditing] = useState<string | null>(null);
  const [rows, setRows] = useState<EditRow[]>([]);

  const users = usersQ.data ?? [];
  const adminId = users.find((u) => u.role === "admin")?.id ?? "";
  const summary = summaryQ.data ?? [];
  // Fuentes = usuarios no-admin (su profit se reparte)
  const sources = summary.filter((r) => users.find((u) => u.id === r.userId)?.role !== "admin");

  function startEdit(userId: string, current: { beneficiaryUserId: string; percent: number }[]) {
    if (current.length) {
      setRows(current.map((r) => ({ beneficiaryUserId: r.beneficiaryUserId, percent: String(r.percent) })));
    } else {
      setRows([
        { beneficiaryUserId: userId, percent: "100" },
        ...(adminId && adminId !== userId ? [{ beneficiaryUserId: adminId, percent: "0" }] : []),
      ]);
    }
    setEditing(userId);
  }

  function save(userId: string) {
    setSplit.mutate({
      sourceUserId: userId,
      rows: rows
        .filter((r) => r.beneficiaryUserId && r.percent !== "")
        .map((r) => ({ beneficiaryUserId: r.beneficiaryUserId, percent: parseFloat(r.percent) || 0 })),
    });
  }

  const sum = rows.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0);
  const sumOk = Math.abs(sum - 100) < 0.01;

  return (
    <div className="rounded-xl p-6" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="mb-1 flex items-center gap-2">
        <Coins className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Distribución de ganancias</h2>
      </div>
      <p className="mb-4 text-[11px] leading-relaxed" style={{ color: "var(--color-subtle)" }}>
        Se reparte <strong>revenue − gasto de VCC</strong> de cada persona. Las filas deben sumar <strong>100%</strong>
        {" "}(incluí al usuario y al admin; agregá estrategistas u otros).
      </p>

      {summaryQ.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
      ) : sources.length === 0 ? (
        <p className="py-6 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>Sin usuarios todavía.</p>
      ) : (
        <div className="space-y-3">
          {sources.map((u) => {
            const isEditing = editing === u.userId;
            return (
              <div key={u.userId} className="rounded-lg p-3.5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
                {/* Cabecera del usuario */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{u.username}</span>
                  <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
                    rev {money(u.revenue)} − vcc {money(u.vccCost)} =
                  </span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: u.splitBase >= 0 ? "var(--color-success)" : "var(--color-error)" }}>
                    {money(u.splitBase)}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>a repartir</span>
                  {!isEditing && (
                    <button type="button" onClick={() => startEdit(u.userId, u.splits)}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
                      style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
                      <Pencil className="h-3 w-3" /> Editar reparto
                    </button>
                  )}
                </div>

                {/* Vista (no editando) */}
                {!isEditing && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {u.splits.length === 0 ? (
                      <span className="text-xs" style={{ color: "var(--color-subtle)" }}>Sin reparto definido (todo al usuario).</span>
                    ) : u.splits.map((s) => (
                      <span key={s.beneficiaryUserId} className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                        {s.beneficiaryName} <span style={{ color: "var(--color-subtle)" }}>{s.percent}%</span>
                        {" · "}<span style={{ color: "var(--color-foreground)" }}>{money(s.amount)}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Editor */}
                {isEditing && (
                  <div className="mt-3 space-y-2">
                    {rows.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <select
                          value={r.beneficiaryUserId}
                          onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, beneficiaryUserId: e.target.value } : x))}
                          className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-xs outline-none"
                          style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                        >
                          <option value="">Elegí…</option>
                          {users.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.username}{opt.id === u.userId ? " (usuario)" : opt.role === "admin" ? " (admin)" : opt.role === "estrategista" ? " (estrategista)" : ""}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number" min={0} max={100} value={r.percent}
                          onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, percent: e.target.value } : x))}
                          className="w-16 rounded-md px-2 py-1.5 text-xs tabular-nums outline-none"
                          style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--color-subtle)" }}>%</span>
                        <button type="button" onClick={() => setRows((p) => p.filter((_, j) => j !== i))}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                          style={{ color: "var(--color-muted-foreground)" }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button type="button" onClick={() => setRows((p) => [...p, { beneficiaryUserId: "", percent: "" }])}
                        className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>
                        <Plus className="h-3 w-3" /> Agregar
                      </button>
                      <span className="text-[11px] font-medium" style={{ color: sumOk ? "var(--color-success)" : "var(--color-error)" }}>
                        Suma: {sum}% {sumOk ? "✓" : "(tiene que ser 100%)"}
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <button type="button" onClick={() => setEditing(null)} className="rounded-md px-3 py-1.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Cancelar</button>
                        <button type="button" onClick={() => save(u.userId)} disabled={!sumOk || setSplit.isPending}
                          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
                          {setSplit.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar
                        </button>
                      </div>
                    </div>
                    {setSplit.error && (
                      <p className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-error)" }}>
                        <AlertCircle className="h-3.5 w-3.5" /> {setSplit.error.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
