"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

export function CampaignDelete({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false); // presente en el DOM
  const [show, setShow] = useState(false);        // estado de animación

  const del = api.campaign.delete.useMutation({
    onSuccess: () => { close(); setTimeout(() => router.refresh(), 200); },
    onError: (e) => alert(e.message),
  });

  function open() { setMounted(true); }
  function close() { setShow(false); setTimeout(() => setMounted(false), 200); }

  useEffect(() => {
    if (!mounted) return;
    const raf = requestAnimationFrame(() => setShow(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [mounted]);

  return (
    <>
      <button
        title="Eliminar"
        disabled={del.isPending}
        onClick={open}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-40"
        style={{ color: "var(--color-muted-foreground)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-error-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--color-error)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--color-muted-foreground)"; }}
      >
        {del.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>

      {mounted && createPortal(
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
          style={{
            background: "rgba(0,0,0,0.7)",
            backdropFilter: show ? "blur(8px)" : "blur(0px)",
            WebkitBackdropFilter: show ? "blur(8px)" : "blur(0px)",
            opacity: show ? 1 : 0,
            transition: "opacity .2s ease, backdrop-filter .2s ease, -webkit-backdrop-filter .2s ease",
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl p-5 motion-reduce:transition-none"
            style={{
              background: "var(--color-surface-raised)",
              border: "1px solid var(--color-border)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
              opacity: show ? 1 : 0,
              transform: show ? "translateY(0) scale(1)" : "translateY(8px) scale(0.97)",
              transition: "opacity .2s ease, transform .25s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "var(--color-error-bg)" }}>
              <AlertTriangle className="h-5 w-5" style={{ color: "var(--color-error)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Eliminar campaña</p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
              ¿Seguro que querés eliminar <strong style={{ color: "var(--color-foreground)" }}>{name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={del.isPending}
                className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => del.mutate({ id })}
                disabled={del.isPending}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--color-error)", color: "#fff" }}
              >
                {del.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
