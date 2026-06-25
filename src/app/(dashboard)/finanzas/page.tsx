"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { Coins, Loader2, Pencil, Check, X, Plus, Trash2 } from "lucide-react";

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

type EditRow = { beneficiaryUserId: string; percent: string };

export default function FinanzasPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const summary = api.accounting.summary.useQuery();
  const usersQ  = api.admin.users.useQuery(undefined, { enabled: !!isAdmin });
  const utils   = api.useUtils();
  const setSplit = api.accounting.setSplit.useMutation({
    onSuccess: () => { setEditing(null); void utils.accounting.summary.invalidate(); },
    onError:   (e) => alert(e.message),
  });

  const [editing, setEditing] = useState<string | null>(null);
  const [rows, setRows] = useState<EditRow[]>([]);

  function startEdit(userId: string, current: { beneficiaryUserId: string; percent: number }[]) {
    setRows(current.length ? current.map((r) => ({ beneficiaryUserId: r.beneficiaryUserId, percent: String(r.percent) })) : [{ beneficiaryUserId: userId, percent: "100" }]);
    setEditing(userId);
  }
  function save(userId: string) {
    setSplit.mutate({
      sourceUserId: userId,
      rows: rows.filter((r) => r.beneficiaryUserId && r.percent).map((r) => ({ beneficiaryUserId: r.beneficiaryUserId, percent: parseFloat(r.percent) })),
    });
  }
  const editSum = rows.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0);

  const data = summary.data ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Coins className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Finanzas</h1>
      </header>

      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-3">
          {summary.isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
          ) : data.length === 0 ? (
            <div className="rounded-2xl py-16 text-center" style={{ border: "1px dashed var(--color-border)" }}>
              <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Sin datos todavía.</p>
            </div>
          ) : data.map((u) => {
            const up = u.profit >= 0;
            const isEditing = editing === u.userId;
            return (
              <div key={u.userId} className="rounded-2xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
                {/* head: usuario + profit */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{u.username}</p>
                    <p className="mt-0.5 text-[11px] tabular-nums" style={{ color: "var(--color-subtle)", fontFamily: "var(--font-mono)" }}>
                      rev {usd(u.revenue)} · vcc {usd(u.vccCost)} · suite {usd(u.suiteCost)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>Profit</p>
                    <p className="text-xl font-bold tabular-nums" style={{ color: up ? "var(--color-success)" : "var(--color-error)", fontFamily: "var(--font-brand)" }}>
                      {usd(u.profit)}
                    </p>
                  </div>
                </div>

                {/* reparto */}
                <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
                  {!isEditing ? (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                      {u.splits.length === 0 ? (
                        <span className="text-xs" style={{ color: "var(--color-subtle)" }}>Sin reparto configurado</span>
                      ) : u.splits.map((s) => (
                        <span key={s.beneficiaryUserId} className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                          {s.beneficiaryName} <span style={{ color: "var(--color-subtle)" }}>{s.percent}%</span>{" "}
                          <span className="tabular-nums font-semibold" style={{ color: up ? "var(--color-success)" : "var(--color-error)" }}>{usd(s.amount)}</span>
                        </span>
                      ))}
                      {isAdmin && (
                        <button type="button" onClick={() => startEdit(u.userId, u.splits)} className="ml-auto inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--color-subtle)" }}>
                          <Pencil className="h-3 w-3" /> Editar reparto
                        </button>
                      )}
                    </div>
                  ) : (
                    /* editor */
                    <div className="space-y-2">
                      {rows.map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <select
                            value={r.beneficiaryUserId}
                            onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, beneficiaryUserId: e.target.value } : x))}
                            className="flex-1 rounded-md px-2 py-1.5 text-xs outline-none"
                            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                          >
                            <option value="">Beneficiario…</option>
                            {(usersQ.data ?? []).map((opt) => <option key={opt.id} value={opt.id}>{opt.username}</option>)}
                          </select>
                          <input
                            type="number" value={r.percent}
                            onChange={(e) => setRows((p) => p.map((x, j) => j === i ? { ...x, percent: e.target.value } : x))}
                            className="w-16 rounded-md px-2 py-1.5 text-xs outline-none"
                            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                            placeholder="%"
                          />
                          <button type="button" onClick={() => setRows((p) => p.filter((_, j) => j !== i))} style={{ color: "var(--color-subtle)" }}><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      ))}
                      <div className="flex items-center justify-between">
                        <button type="button" onClick={() => setRows((p) => [...p, { beneficiaryUserId: "", percent: "" }])} className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>
                          <Plus className="h-3 w-3" /> Agregar
                        </button>
                        <span className="text-[11px] tabular-nums" style={{ color: editSum === 100 ? "var(--color-success)" : "var(--color-warning)" }}>
                          {editSum}%{editSum !== 100 ? " (debe sumar 100)" : ""}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setEditing(null)} className="flex-1 rounded-md py-1.5 text-xs" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
                          <X className="mx-auto h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => save(u.userId)} disabled={setSplit.isPending} className="flex flex-[2] items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold" style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
                          {setSplit.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar reparto
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <p className="px-1 pt-2 text-[11px] leading-relaxed" style={{ color: "var(--color-subtle)" }}>
            Profit = ingresos de las campañas del usuario − gasto de sus VCCs (live) − gasto de suite/interacciones (registrado). El reparto divide ese profit entre los beneficiarios.
          </p>
        </div>
      </main>
    </div>
  );
}
