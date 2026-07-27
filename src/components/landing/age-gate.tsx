"use client";

import { useEffect, useState } from "react";
import type { AgeCopy } from "@/lib/age-gate-i18n";

/**
 * Intercepta el click en cualquier CTA de la landing (`a[data-cta]`) y muestra
 * una pregunta de edad. "+21" va a la oferta principal; "-21" a la oferta
 * configurada para menores (o a la misma si no se definió una).
 * Se renderiza FUERA del gate/transform para que el overlay `fixed` funcione bien.
 */
export function AgeGate({
  over21, under21, copy, accent = "#22e07a",
}: {
  over21: string;
  under21: string;
  copy: AgeCopy;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[data-cta]");
      if (!a) return;
      e.preventDefault();
      setOpen(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, zIndex: 2147483000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        background: "rgba(4,6,12,0.72)", backdropFilter: "blur(6px)",
        animation: "ageFade .18s ease both",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%", maxWidth: 380, borderRadius: 20, padding: "28px 24px",
          textAlign: "center", color: "#f4f6fb",
          background: "linear-gradient(180deg, #14161d, #0b0c11)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 40px 90px -20px rgba(0,0,0,0.85)",
          animation: "agePop .22s cubic-bezier(.2,.8,.2,1) both",
        }}
      >
        <div style={{
          width: 52, height: 52, margin: "0 auto 16px", borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26, fontWeight: 800, color: "#05070c",
          background: `linear-gradient(180deg, color-mix(in oklch, ${accent} 92%, white), ${accent})`,
        }}>21</div>

        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>{copy.question}</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
          <a
            href={over21}
            style={{
              display: "block", padding: "14px 18px", borderRadius: 12, textDecoration: "none",
              fontSize: 16, fontWeight: 700, color: "#04140b",
              background: `linear-gradient(180deg, ${accent}, color-mix(in oklch, ${accent} 82%, black))`,
              boxShadow: `0 10px 28px -8px color-mix(in oklch, ${accent} 60%, transparent)`,
            }}
          >{copy.yes}</a>
          <a
            href={under21}
            style={{
              display: "block", padding: "13px 18px", borderRadius: 12, textDecoration: "none",
              fontSize: 15, fontWeight: 600, color: "#c4ccda",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)",
            }}
          >{copy.no}</a>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html:
        "@keyframes ageFade{from{opacity:0}to{opacity:1}}@keyframes agePop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}"
      }} />
    </div>
  );
}
