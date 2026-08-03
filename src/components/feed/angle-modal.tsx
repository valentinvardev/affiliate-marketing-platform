"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ReactCountryFlag from "react-country-flag";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "@/lib/i18n-client";

export type Slide = { id: string; url: string; caption: string | null };

/** Modal del ángulo: diapositivas navegables + descripción. */
export function AngleModal({
  open, onClose, title, description, slides, countryCode,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string | null;
  slides: Slide[];
  countryCode: string | null;
}) {
  const [i, setI] = useState(0);

  const prev = useCallback(() => setI((v) => (v - 1 + slides.length) % Math.max(slides.length, 1)), [slides.length]);
  const next = useCallback(() => setI((v) => (v + 1) % Math.max(slides.length, 1)), [slides.length]);

  useEffect(() => { if (open) setI(0); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, next, prev]);

  if (!open || typeof document === "undefined") return null;
  const cur = slides[i];

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 md:p-6"
      style={{ background: "rgba(4,6,12,0.8)", backdropFilter: "blur(6px)", animation: "aiFade .16s ease both" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className="tut-enter flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl"
        style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 30px 90px rgba(0,0,0,0.7)" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
          {countryCode && (
            <ReactCountryFlag countryCode={countryCode} svg style={{ width: "1.3em", height: "1em", borderRadius: 2 }} />
          )}
          <span className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            title={t("Cerrar")}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-70"
            style={{ color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Diapositivas */}
          {slides.length > 0 && (
            <div className="relative" style={{ background: "#07080c" }}>
              <div className="flex items-center justify-center" style={{ minHeight: 260, maxHeight: "58vh" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={cur?.id}
                  src={cur?.url}
                  alt={cur?.caption ?? ""}
                  className="tut-enter"
                  style={{ maxWidth: "100%", maxHeight: "58vh", objectFit: "contain", display: "block" }}
                />
              </div>

              {slides.length > 1 && (
                <>
                  <NavBtn side="left" onClick={prev} label={t("Anterior")}><ChevronLeft className="h-5 w-5" /></NavBtn>
                  <NavBtn side="right" onClick={next} label={t("Siguiente")}><ChevronRight className="h-5 w-5" /></NavBtn>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                    {slides.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setI(idx)}
                        aria-label={`${t("Diapositiva")} ${idx + 1}`}
                        style={{
                          width: idx === i ? 18 : 6, height: 6, borderRadius: 999,
                          background: idx === i ? "#fff" : "rgba(255,255,255,0.45)",
                          transition: "width .22s ease, background .22s ease", cursor: "pointer", border: "none",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="px-4 py-4 md:px-5">
            {slides.length > 0 && (
              <p className="mb-3 text-[11px] tabular-nums" style={{ color: "var(--color-subtle)" }}>
                {t("Diapositiva")} {i + 1} / {slides.length}
                {cur?.caption ? ` · ${cur.caption}` : ""}
              </p>
            )}
            {description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
                {description}
              </p>
            ) : (
              <p className="text-xs" style={{ color: "var(--color-subtle)" }}>{t("Sin descripción.")}</p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function NavBtn({
  side, onClick, label, children,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute top-1/2 flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-100"
      style={{
        [side]: 10, transform: "translateY(-50%)", opacity: 0.75,
        background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.22)",
        color: "#fff", backdropFilter: "blur(4px)",
      }}
    >
      {children}
    </button>
  );
}
