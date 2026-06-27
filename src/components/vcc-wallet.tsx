"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import {
  X, Eye, EyeOff, RefreshCw, ArrowUpCircle, XCircle, Plus, Loader2, Check,
  MoreHorizontal, AlertTriangle, Copy,
} from "lucide-react";

type VCC = {
  id: string; cardName?: string; cardNumber?: string; last4?: string; cvv?: string;
  expiryMonth?: string; expiryYear?: string; spendLimit?: number; currentSpend?: number;
  status?: string; isPaused?: boolean; campaignId?: string | null; closedAt?: string | null;
  [k: string]: unknown;
};

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

/** Billetera de VCCs de una campaña: tarjetas en abanico + acciones. */
export function VccWallet({
  campaignId, campaignName, open, onClose,
}: { campaignId: string; campaignName: string; open: boolean; onClose: () => void }) {
  const utils = api.useUtils();
  const cardsQ = api.cards.list.useQuery(undefined, { enabled: open, retry: false });
  const cards = ((cardsQ.data?.cards ?? []) as unknown as VCC[]).filter((c) => c.campaignId === campaignId);

  // newest first (por el número del nombre)
  const num = (n?: string) => { const m = /(\d+)\s*$/.exec(n ?? ""); return m ? parseInt(m[1]!) : 0; };
  const sorted = [...cards].sort((a, b) => num(b.cardName) - num(a.cardName));

  const [active, setActive] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<string | null>(null);
  const [limitFor, setLimitFor] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = () => void utils.cards.list.invalidate();
  const sync = api.cards.syncSpend.useMutation({ onSettled: refresh });
  const inc = api.cards.increaseLimit.useMutation({ onSuccess: () => { setLimitFor(null); refresh(); } });
  const close = api.cards.close.useMutation({ onSuccess: refresh });
  const createVcc = api.cards.createForCampaign.useMutation({ onSuccess: () => { setCreating(false); refresh(); } });

  if (!open) return null;

  const activeId = active ?? sorted[0]?.id ?? null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Tarjetas de la campaña</p>
            <p className="truncate text-xs" style={{ color: "var(--color-subtle)" }}>{campaignName} · {cards.length} VCC{cards.length === 1 ? "" : "s"}</p>
          </div>
          <button type="button" onClick={onClose} style={{ color: "var(--color-subtle)" }}><X className="h-4 w-4" /></button>
        </div>

        {/* Generar VCC */}
        <div className="shrink-0 px-5 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
          {creating ? (
            <GenerateVcc
              campaignName={campaignName}
              next={cards.length + 1}
              pending={createVcc.isPending}
              error={createVcc.error?.message ?? null}
              onCancel={() => setCreating(false)}
              onCreate={(limit) => createVcc.mutate({ campaignId, spendLimit: limit })}
            />
          ) : (
            <button type="button" onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
              <Plus className="h-3.5 w-3.5" /> Generar VCC
            </button>
          )}
        </div>

        {/* Solapitas */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {cardsQ.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
          ) : !cardsQ.data?.connected ? (
            <p className="py-8 text-center text-xs" style={{ color: "var(--color-subtle)" }}>Conectá la sesión de TapRain en Tarjetas.</p>
          ) : sorted.length === 0 ? (
            <p className="py-8 text-center text-xs" style={{ color: "var(--color-subtle)" }}>Esta campaña no tiene VCCs. Generá una arriba.</p>
          ) : (
            <div className="flex flex-col">
              {sorted.map((c, i) => {
                const isOpen = activeId === c.id;
                const rv = !!revealed[c.id];
                const spent = c.currentSpend ?? 0, lim = c.spendLimit ?? 0;
                const pct = lim > 0 ? Math.min(100, (spent / lim) * 100) : 0;
                return (
                  <div key={c.id} style={{ marginTop: i === 0 ? 0 : isOpen ? 14 : -56, transition: "margin .3s cubic-bezier(0.22,1,0.36,1)", zIndex: isOpen ? 30 : i }}>
                    {/* Card face */}
                    <button type="button" onClick={() => setActive(isOpen ? null : c.id)} className="block w-full text-left">
                      <CardFace card={c} revealed={rv} dim={!isOpen} />
                    </button>

                    {/* Detalle + acciones (solo la activa) */}
                    {isOpen && (
                      <div className="mt-2 rounded-xl p-3" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
                        {/* gasto */}
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: "var(--color-muted-foreground)" }}>Gasto</span>
                          <span className="font-mono tabular-nums" style={{ color: "var(--color-foreground)" }}>{usd(spent)} / {usd(lim)}</span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full" style={{ background: "var(--color-surface-raised)" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: pct > 90 ? "var(--color-error)" : "var(--color-success)" }} />
                        </div>

                        {/* acciones */}
                        <div className="mt-3 flex items-center gap-1.5">
                          <ActionBtn onClick={() => setRevealed((r) => ({ ...r, [c.id]: !rv }))}>
                            {rv ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {rv ? "Ocultar" : "Revelar"}
                          </ActionBtn>
                          {rv && c.cardNumber && (
                            <ActionBtn onClick={() => navigator.clipboard.writeText(c.cardNumber!).catch(() => {})}>
                              <Copy className="h-3.5 w-3.5" /> Copiar
                            </ActionBtn>
                          )}
                          <div className="relative ml-auto">
                            <button type="button" onClick={() => setMenu(menu === c.id ? null : c.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {menu === c.id && (
                              <div className="absolute right-0 z-40 mt-1 w-44 overflow-hidden rounded-lg py-1" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}
                                onMouseLeave={() => setMenu(null)}>
                                <MenuItem onClick={() => { setMenu(null); sync.mutate({ vccId: c.id }); }} disabled={sync.isPending}>
                                  <RefreshCw className={`h-3.5 w-3.5 ${sync.isPending ? "animate-spin" : ""}`} /> Sincronizar gasto
                                </MenuItem>
                                <MenuItem onClick={() => { setMenu(null); setLimitFor(c.id); }}>
                                  <ArrowUpCircle className="h-3.5 w-3.5" /> Subir límite
                                </MenuItem>
                                {!c.closedAt && (
                                  <MenuItem danger onClick={() => { setMenu(null); if (confirm(`¿Cerrar ${c.cardName}? Se pausa la tarjeta.`)) close.mutate({ vccId: c.id }); }}>
                                    <XCircle className="h-3.5 w-3.5" /> Cerrar tarjeta
                                  </MenuItem>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* subir límite inline */}
                        {limitFor === c.id && (
                          <LimitForm current={lim} pending={inc.isPending} error={inc.error?.message ?? null}
                            onCancel={() => setLimitFor(null)}
                            onConfirm={(add) => inc.mutate({ vccId: c.id, spendLimit: lim + add })} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Card face (visual de tarjeta) ── */
function CardFace({ card, revealed, dim }: { card: VCC; revealed?: boolean; dim?: boolean }) {
  const last4 = card.last4 ?? card.cardNumber?.slice(-4) ?? "0000";
  const full = card.cardNumber ? card.cardNumber.replace(/(.{4})/g, "$1 ").trim() : "";
  const number = revealed && full ? full : `•••• •••• •••• ${last4}`;
  const exp = card.expiryMonth ? `${card.expiryMonth}/${String(card.expiryYear ?? "").slice(-2)}` : "••/••";
  const closed = !!card.closedAt || card.status === "closed";
  return (
    <div className="relative flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden rounded-2xl p-4 transition-all"
      style={{ background: "linear-gradient(135deg, #1c1c1c 0%, #0c0c0c 60%, #050505 100%)", border: "1px solid var(--color-border)", boxShadow: dim ? "0 6px 20px rgba(0,0,0,0.4)" : "0 14px 44px rgba(0,0,0,0.6)", opacity: closed ? 0.55 : 1 }}>
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.06) 0%, transparent 40%)" }} />
      <div className="relative flex items-start justify-between">
        <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 15, color: "#fff" }}>TapSur</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: closed ? "var(--color-error)" : "var(--color-subtle)" }}>{closed ? "Cerrada" : "Virtual"}</span>
      </div>
      <div className="relative mt-1 h-6 w-9 rounded-md" style={{ background: "linear-gradient(135deg, #caa15a, #8c6a2f)" }} />
      <div className="relative">
        <p className="tabular-nums" style={{ fontFamily: "var(--font-mono)", fontSize: 15, letterSpacing: 1.5, color: "#ededed" }}>{number}</p>
        <div className="mt-1.5 flex items-end justify-between">
          <span className="truncate pr-2 text-[11px] uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>{card.cardName ?? "VCC"}</span>
          <span className="shrink-0 text-[11px] tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>
            {exp}{revealed && card.cvv ? ` · ${card.cvv}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Subir límite (incremental, con cálculo en vivo) ── */
function LimitForm({ current, pending, error, onConfirm, onCancel }: { current: number; pending: boolean; error: string | null; onConfirm: (add: number) => void; onCancel: () => void }) {
  const [val, setVal] = useState("");
  const add = parseFloat(val) || 0;
  return (
    <div className="mt-3 rounded-lg p-3" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <p className="mb-1 text-[11px] font-medium" style={{ color: "var(--color-muted-foreground)" }}>¿Cuánto sumar? (USD)</p>
      <input value={val} onChange={(e) => setVal(e.target.value)} type="number" placeholder="50" autoFocus
        className="w-full rounded-md px-3 py-1.5 text-sm outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
      <p className="mt-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>{usd(current)} + {usd(add)} = <strong style={{ color: "var(--color-foreground)" }}>{usd(current + add)}</strong></p>
      {error && <p className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: "var(--color-error)" }}><AlertTriangle className="h-3 w-3" /> {error}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Cancelar</button>
        <button type="button" onClick={() => add > 0 && onConfirm(add)} disabled={pending || add <= 0}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold disabled:opacity-40" style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpCircle className="h-3.5 w-3.5" />} Subir a {usd(current + add)}
        </button>
      </div>
    </div>
  );
}

/* ── Generar VCC ── */
function GenerateVcc({ campaignName, next, pending, error, onCreate, onCancel }: { campaignName: string; next: number; pending: boolean; error: string | null; onCreate: (limit: number) => void; onCancel: () => void }) {
  const [val, setVal] = useState("");
  const lim = parseFloat(val) || 0;
  return (
    <div>
      <p className="mb-1.5 text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>
        Nueva: <span className="font-mono" style={{ color: "var(--color-foreground)" }}>{campaignName} {next}</span> · límite inicial (USD)
      </p>
      <div className="flex items-center gap-2">
        <input value={val} onChange={(e) => setVal(e.target.value)} type="number" placeholder="50" autoFocus
          className="min-w-0 flex-1 rounded-md px-3 py-1.5 text-sm outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
        <button type="button" onClick={onCancel} className="rounded-md px-2 py-1.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Cancelar</button>
        <button type="button" onClick={() => lim > 0 && onCreate(lim)} disabled={pending || lim <= 0}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-40" style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Generar
        </button>
      </div>
      {error && <p className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: "var(--color-error)" }}><AlertTriangle className="h-3 w-3" /> {error}</p>}
    </div>
  );
}

function ActionBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
      style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>{children}</button>
  );
}

function MenuItem({ onClick, children, danger, disabled }: { onClick: () => void; children: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors disabled:opacity-50"
      style={{ color: danger ? "var(--color-error)" : "var(--color-muted-foreground)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      {children}
    </button>
  );
}
