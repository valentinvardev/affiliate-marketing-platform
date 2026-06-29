"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Shuffle, Search, X, Loader2, Check, AlertTriangle } from "lucide-react";

export function ConversionReassign({ id, currentS1, offerName }: { id: string; currentS1: string | null; offerName: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" title="Reasignar a otra campaña" onClick={() => setOpen(true)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:opacity-70"
        style={{ color: "var(--color-muted-foreground)" }}>
        <Shuffle className="h-3.5 w-3.5" />
      </button>
      {open && <ReassignModal id={id} currentS1={currentS1} offerName={offerName} onClose={() => setOpen(false)} />}
    </>
  );
}

function ReassignModal({ id, currentS1, offerName, onClose }: { id: string; currentS1: string | null; offerName: string | null; onClose: () => void }) {
  const router = useRouter();
  const targetsQ = api.conversions.targets.useQuery();
  const reassign = api.conversions.reassign.useMutation({
    onSuccess: () => { router.refresh(); onClose(); },
    onError: (e) => setErr(e.message),
  });

  const [show, setShow] = useState(false);
  const [s1, setS1] = useState(currentS1 ?? "");
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const all = targetsQ.data ?? [];
  const list = q
    ? all.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.slug.includes(q.toLowerCase()) || (c.owner ?? "").toLowerCase().includes(q.toLowerCase()))
    : all;

  const changed = s1.trim() && s1.trim() !== (currentS1 ?? "");

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: show ? "blur(8px)" : "blur(0)", WebkitBackdropFilter: show ? "blur(8px)" : "blur(0)", opacity: show ? 1 : 0, transition: "opacity .2s ease, backdrop-filter .2s ease" }}>
      <div className="flex max-h-[82vh] w-full max-w-md flex-col overflow-hidden rounded-2xl"
        style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", opacity: show ? 1 : 0, transform: show ? "scale(1)" : "scale(0.97)", transition: "opacity .2s ease, transform .25s cubic-bezier(0.22,1,0.36,1)" }}>
        {/* Header */}
        <div className="shrink-0 px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-2">
            <Shuffle className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Reasignar conversión</p>
            <button type="button" onClick={onClose} className="ml-auto" style={{ color: "var(--color-subtle)" }}><X className="h-4 w-4" /></button>
          </div>
          <p className="mt-1 truncate text-xs" style={{ color: "var(--color-subtle)" }}>
            {offerName ?? "Sin oferta"} · actual s1: <span className="font-mono" style={{ color: "var(--color-muted-foreground)" }}>{currentS1 ?? "—"}</span>
          </p>
        </div>

        {/* s1 destino (editable) */}
        <div className="shrink-0 px-5 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <label className="text-[11px] font-medium" style={{ color: "var(--color-muted-foreground)" }}>s1 destino</label>
          <input value={s1} onChange={(e) => setS1(e.target.value)} placeholder="slug de la campaña"
            className="mt-1 w-full rounded-md px-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }} />
        </div>

        {/* Buscar campaña */}
        <div className="flex shrink-0 items-center gap-2 px-5 py-2.5" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar campaña, slug o usuario…"
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--color-foreground)" }} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {targetsQ.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-xs" style={{ color: "var(--color-subtle)" }}>Sin campañas.</p>
          ) : list.map((c) => {
            const sel = s1.trim() === c.slug;
            return (
              <button key={c.id} type="button" onClick={() => setS1(c.slug)}
                className="flex w-full items-center gap-2 px-5 py-2.5 text-left transition-colors"
                style={{ background: sel ? "rgba(255,255,255,0.05)" : "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = sel ? "rgba(255,255,255,0.05)" : "transparent")}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm" style={{ color: "var(--color-foreground)" }}>{c.name}</span>
                  <span className="block truncate font-mono text-[11px]" style={{ color: "var(--color-subtle)" }}>
                    {c.slug}{c.owner ? ` · ${c.owner}` : ""}
                  </span>
                </span>
                {sel && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-success)" }} />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center gap-3 px-5 py-3" style={{ borderTop: "1px solid var(--color-border)" }}>
          {err && <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-error)" }}><AlertTriangle className="h-3.5 w-3.5" /> {err}</span>}
          <button type="button" onClick={onClose} className="ml-auto rounded-md px-3 py-1.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Cancelar</button>
          <button type="button" disabled={!changed || reassign.isPending}
            onClick={() => { setErr(null); reassign.mutate({ conversionId: id, s1: s1.trim() }); }}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-40"
            style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
            {reassign.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Reasignar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
