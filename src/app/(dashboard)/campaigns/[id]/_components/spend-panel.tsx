"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { CreditCard, Plus, Loader2, X, ChevronDown } from "lucide-react";

export type LinkedCard = { vccId: string; cardName: string; last4: string; currentSpend: number; spendLimit: number };

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

export function SpendPanel({ campaignId, linked }: { campaignId: string; linked: LinkedCard[] }) {
  const router = useRouter();
  const cardsQ = api.cards.list.useQuery();
  const linkMut = api.cards.linkCampaign.useMutation({
    onSuccess: () => { void cardsQ.refetch(); router.refresh(); },
    onError: (e) => alert(e.message),
  });

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const linkedIds = new Set(linked.map((l) => l.vccId));
  const available = (cardsQ.data?.cards ?? []).filter((c) => c.status === "active" && !c.closedAt && !linkedIds.has(c.id));
  const connected = cardsQ.data?.connected ?? true;

  return (
    <div className="rounded-2xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="mb-4 flex items-center gap-2">
        <CreditCard className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-subtle)" }}>Gasto rastreado</span>
      </div>

      {/* Linked cards */}
      <div className="space-y-2.5">
        {linked.map((c) => {
          const pct = c.spendLimit > 0 ? Math.min(100, (c.currentSpend / c.spendLimit) * 100) : 0;
          return (
            <div key={c.vccId} className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "linear-gradient(135deg, #1c1c1c, #0c0c0c)" }}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span className="font-mono text-xs tracking-wider" style={{ color: "var(--color-foreground)" }}>•••• {c.last4}</span>
                <span className="truncate text-[11px]" style={{ color: "var(--color-subtle)" }}>{c.cardName}</span>
                <span className="ml-auto font-mono text-xs tabular-nums" style={{ color: "var(--color-error)" }}>{usd(c.currentSpend)}</span>
                <span className="font-mono text-[11px]" style={{ color: "var(--color-subtle)" }}>/ {usd(c.spendLimit)}</span>
                <button type="button" onClick={() => linkMut.mutate({ vccId: c.vccId, campaignId: null })} disabled={linkMut.isPending} className="shrink-0 transition-opacity hover:opacity-70" style={{ color: "var(--color-subtle)" }} title="Desvincular">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="h-1" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full" style={{ width: `${pct}%`, background: pct > 85 ? "var(--color-error)" : "var(--color-muted-foreground)" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Link control */}
      <div ref={ref} className="relative mt-3">
        <button type="button" onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors"
          style={{ background: "var(--color-surface-overlay)", border: "1px dashed var(--color-border)", color: "var(--color-muted-foreground)" }}>
          {linkMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Vincular tarjeta
          <ChevronDown className="h-3 w-3" style={{ transform: open ? "rotate(180deg)" : "none" }} />
        </button>
        {open && (
          <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}>
            {!connected ? (
              <p className="px-3 py-3 text-xs" style={{ color: "var(--color-subtle)" }}>Conectá la suite en <a href="/cards" className="underline">Tarjetas</a>.</p>
            ) : available.length === 0 ? (
              <p className="px-3 py-3 text-xs" style={{ color: "var(--color-subtle)" }}>No hay tarjetas disponibles.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto py-1">
                {available.map((c) => (
                  <button key={c.id} type="button" onClick={() => { linkMut.mutate({ vccId: c.id, campaignId }); setOpen(false); }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors"
                    style={{ color: "var(--color-muted-foreground)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <span className="font-mono" style={{ color: "var(--color-foreground)" }}>•••• {(c as { last4?: string }).last4 ?? "????"}</span>
                    <span className="truncate">{(c as { cardName?: string }).cardName ?? ""}</span>
                    {(c as { campaignId?: string | null }).campaignId && <span className="ml-auto text-[10px]" style={{ color: "var(--color-warning)" }}>vinculada</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {linked.length === 0 && (
        <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--color-subtle)" }}>
          Vinculá una VCC para descontar su gasto del profit de este subid.
        </p>
      )}
    </div>
  );
}
