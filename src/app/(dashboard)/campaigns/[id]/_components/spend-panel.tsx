"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { CreditCard, Plus, Loader2, ChevronDown, Wallet } from "lucide-react";
import { VccWallet } from "@/components/vcc-wallet";

export type LinkedCard = { vccId: string; cardName: string; last4: string; currentSpend: number; spendLimit: number };

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
const num = (n?: string) => { const m = /(\d+)\s*$/.exec(n ?? ""); return m ? parseInt(m[1]!) : 0; };

export function SpendPanel({ campaignId, campaignName, linked }: { campaignId: string; campaignName: string; linked: LinkedCard[] }) {
  const router = useRouter();
  const [walletOpen, setWalletOpen] = useState(false);
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

  const sorted = [...linked].sort((a, b) => num(b.cardName) - num(a.cardName));
  const newest = sorted[0];
  const totalSpend = linked.reduce((s, c) => s + c.currentSpend, 0);

  const linkedIds = new Set(linked.map((l) => l.vccId));
  const available = (cardsQ.data?.cards ?? []).filter((c) => c.status === "active" && !c.closedAt && !linkedIds.has(c.id));
  const connected = cardsQ.data?.connected ?? true;

  return (
    <div className="rounded-2xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="mb-4 flex items-center gap-2">
        <CreditCard className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--color-subtle)" }}>Gasto rastreado</span>
        {linked.length > 0 && (
          <span className="ml-auto font-mono text-xs tabular-nums" style={{ color: "var(--color-error)" }}>{usd(totalSpend)}</span>
        )}
      </div>

      {/* Tarjeta más nueva */}
      {newest ? (
        <>
          {(() => {
            const pct = newest.spendLimit > 0 ? Math.min(100, (newest.currentSpend / newest.spendLimit) * 100) : 0;
            return (
              <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "linear-gradient(135deg, #1c1c1c, #0c0c0c)" }}>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="font-mono text-xs tracking-wider" style={{ color: "var(--color-foreground)" }}>•••• {newest.last4}</span>
                  <span className="truncate text-[11px]" style={{ color: "var(--color-subtle)" }}>{newest.cardName}</span>
                  <span className="ml-auto font-mono text-xs tabular-nums" style={{ color: "var(--color-error)" }}>{usd(newest.currentSpend)}</span>
                  <span className="font-mono text-[11px]" style={{ color: "var(--color-subtle)" }}>/ {usd(newest.spendLimit)}</span>
                </div>
                <div className="h-1" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full" style={{ width: `${pct}%`, background: pct > 85 ? "var(--color-error)" : "var(--color-muted-foreground)" }} />
                </div>
              </div>
            );
          })()}
          {sorted.length > 1 && (
            <p className="mt-1.5 text-[11px]" style={{ color: "var(--color-subtle)" }}>+{sorted.length - 1} tarjeta{sorted.length - 1 > 1 ? "s" : ""} más en la billetera</p>
          )}
        </>
      ) : (
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-subtle)" }}>
          Sin VCC todavía. Generá una desde la billetera para rastrear el gasto.
        </p>
      )}

      {/* Gestionar tarjetas (billetera) */}
      <button type="button" onClick={() => setWalletOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-opacity hover:opacity-90"
        style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
        <Wallet className="h-3.5 w-3.5" /> Gestionar tarjetas{linked.length ? ` (${linked.length})` : ""}
      </button>

      {/* Vincular existente (secundario) */}
      <div ref={ref} className="relative mt-2">
        <button type="button" onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors"
          style={{ background: "var(--color-surface-overlay)", border: "1px dashed var(--color-border)", color: "var(--color-muted-foreground)" }}>
          {linkMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Vincular tarjeta existente
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

      <VccWallet campaignId={campaignId} campaignName={campaignName} open={walletOpen}
        onClose={() => { setWalletOpen(false); void cardsQ.refetch(); router.refresh(); }} />
    </div>
  );
}
