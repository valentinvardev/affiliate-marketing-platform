"use client";

import { useState, useRef, useLayoutEffect, useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

type Side = "top" | "bottom" | "left" | "right";
type Coords = { top: number; left: number; side: Side; arrow: number };

/**
 * Tooltip propio (sin dependencias). Envuelve un elemento — típicamente un
 * botón de icono — y muestra un texto flotante estilizado al hacer hover o foco.
 * Se renderiza en un portal (no lo recorta ningún overflow) y se reubica solo
 * (flip + clamp) para no salirse de la pantalla.
 */
export function Tooltip({
  content, children, side = "top", gap = 8, delay = 110, maxWidth = 240,
}: {
  content: ReactNode;
  children: ReactNode;
  side?: Side;
  gap?: number;
  delay?: number;
  maxWidth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const showT = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();
  const mounted = typeof document !== "undefined";

  function place() {
    const trigger = triggerRef.current, tip = tipRef.current;
    if (!trigger || !tip) return;
    const r = trigger.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight, pad = 8;

    let s = side;
    if (s === "top" && r.top - t.height - gap < pad) s = "bottom";
    else if (s === "bottom" && r.bottom + t.height + gap > vh - pad) s = "top";
    else if (s === "left" && r.left - t.width - gap < pad) s = "right";
    else if (s === "right" && r.right + t.width + gap > vw - pad) s = "left";

    let top = 0, left = 0;
    if (s === "top")         { top = r.top - t.height - gap;  left = r.left + r.width / 2 - t.width / 2; }
    else if (s === "bottom") { top = r.bottom + gap;          left = r.left + r.width / 2 - t.width / 2; }
    else if (s === "left")   { left = r.left - t.width - gap; top = r.top + r.height / 2 - t.height / 2; }
    else                     { left = r.right + gap;          top = r.top + r.height / 2 - t.height / 2; }

    const clampedLeft = Math.max(pad, Math.min(left, vw - t.width - pad));
    const clampedTop  = Math.max(pad, Math.min(top,  vh - t.height - pad));

    // Posición de la flecha: apuntar al centro del trigger, dentro de los límites del tip.
    const arrow = (s === "top" || s === "bottom")
      ? Math.max(12, Math.min(r.left + r.width / 2 - clampedLeft, t.width - 12))
      : Math.max(12, Math.min(r.top + r.height / 2 - clampedTop, t.height - 12));

    setCoords({ top: clampedTop, left: clampedLeft, side: s, arrow });
  }

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const on = () => place();
    window.addEventListener("scroll", on, true);
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on, true);
      window.removeEventListener("resize", on);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") hide(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => clearTimeout(showT.current), []);

  function show() {
    clearTimeout(showT.current);
    showT.current = setTimeout(() => setOpen(true), delay);
  }
  function hide() {
    clearTimeout(showT.current);
    setOpen(false);
    setCoords(null);
  }

  const s = coords?.side ?? side;
  // Bordes de la flecha visibles según el lado (la flecha "apunta" hacia el trigger).
  const arrowBorder =
    s === "top"    ? { borderRight: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }
    : s === "bottom" ? { borderLeft: "1px solid var(--color-border)", borderTop: "1px solid var(--color-border)" }
    : s === "left"   ? { borderTop: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)" }
    :                  { borderBottom: "1px solid var(--color-border)", borderLeft: "1px solid var(--color-border)" };
  const arrowPos: React.CSSProperties =
    s === "top"    ? { bottom: -5, left: coords?.arrow, marginLeft: -5 }
    : s === "bottom" ? { top: -5, left: coords?.arrow, marginLeft: -5 }
    : s === "left"   ? { right: -5, top: coords?.arrow, marginTop: -5 }
    :                  { left: -5, top: coords?.arrow, marginTop: -5 };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={open ? id : undefined}
        style={{ display: "inline-flex" }}
      >
        {children}
      </span>

      {mounted && open && createPortal(
        <div
          ref={tipRef}
          id={id}
          role="tooltip"
          className="tip-pop"
          style={{
            position: "fixed",
            top: coords?.top ?? -9999,
            left: coords?.left ?? -9999,
            zIndex: 9999,
            maxWidth,
            padding: "6px 9px",
            borderRadius: 8,
            fontSize: 12,
            lineHeight: 1.4,
            fontWeight: 500,
            color: "var(--color-foreground)",
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.55)",
            pointerEvents: "none",
            opacity: coords ? 1 : 0,
            whiteSpace: maxWidth ? "normal" : "nowrap",
          }}
        >
          {content}
          <span
            style={{
              position: "absolute",
              width: 8,
              height: 8,
              background: "var(--color-surface-raised)",
              transform: "rotate(45deg)",
              ...arrowBorder,
              ...arrowPos,
            }}
          />
        </div>,
        document.body,
      )}
    </>
  );
}

/**
 * Icono de información (ⓘ) que muestra un tooltip al hacer hover/foco.
 * Ideal para explicar métricas, campos o acciones sin ocupar espacio.
 */
export function InfoTooltip({
  content, side = "top", size = 13, className,
}: {
  content: ReactNode;
  side?: Side;
  size?: number;
  className?: string;
}) {
  return (
    <Tooltip content={content} side={side}>
      <button
        type="button"
        aria-label="Más información"
        className={className}
        onClick={(e) => e.preventDefault()}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "help",
          color: "var(--color-subtle)",
          transition: "color .15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-muted-foreground)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-subtle)")}
      >
        <Info style={{ width: size, height: size }} />
      </button>
    </Tooltip>
  );
}
