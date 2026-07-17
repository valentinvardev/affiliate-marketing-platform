"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";

/**
 * Gate anti-bots: muestra solo un teaser (titular + chevrons + "deslizá").
 * La landing real (`children`) NO se renderiza en el DOM hasta que un humano
 * interactúa (scroll / swipe / click / tecla). Así los bots que hacen preview
 * (screenshot del viewport o render del top) ven únicamente el gate.
 */
export function LanderGate({
  children,
  primary,
  bg,
  headlineA,
  headlineHighlight,
  headlineB,
  swipe,
  variant = "classic",
  logoUrl,
  brand,
}: {
  children: React.ReactNode;
  primary: string;
  bg: string;
  headlineA: string;
  headlineHighlight: string;
  headlineB: string;
  swipe: string;
  variant?: "classic" | "v2";
  logoUrl?: string | null;
  brand?: string;
}) {
  const isV2 = variant === "v2";
  const gateBg = isV2 ? "#07080c" : bg;
  const headFont = isV2 ? "'Space Grotesk', system-ui, sans-serif" : "'Inter', system-ui, -apple-system, sans-serif";
  const [revealed, setRevealed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (revealed) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // bloquear scroll mientras el gate está arriba

    const go = () => {
      if (leavingRef.current) return;
      leavingRef.current = true;
      setLeaving(true);
      window.setTimeout(() => {
        document.body.style.overflow = prevOverflow;
        setRevealed(true);
      }, 460);
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0]?.clientY ?? 0; };
    const onTouchMove = (e: TouchEvent) => {
      if (Math.abs(touchStartY - (e.touches[0]?.clientY ?? touchStartY)) > 24) go();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (Math.abs(touchStartY - (e.changedTouches[0]?.clientY ?? touchStartY)) > 24) go();
    };
    // Cualquier scroll/gesto sirve (en desktop "swipe up" es deltaY < 0).
    const onWheel = (e: WheelEvent) => { if (Math.abs(e.deltaY) > 4) go(); };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", " ", "Enter", "PageDown", "PageUp"].includes(e.key)) go();
    };
    const onClick = () => go();

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
      document.body.style.overflow = prevOverflow;
    };
  }, [revealed]);

  if (revealed) return <>{children}</>;

  return (
    <div
      className="lgate"
      role="button"
      tabIndex={0}
      aria-label={swipe}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "0 24px",
        textAlign: "center",
        cursor: "pointer",
        background: isV2
          ? `radial-gradient(90% 55% at 50% 12%, color-mix(in oklch, ${primary} 26%, transparent), transparent 62%), ${gateBg}`
          : gateBg,
        color: "#fff",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {isV2 && <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" />}
      {isV2 && (
        <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5,
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(100% 70% at 50% 0%, #000 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(100% 70% at 50% 0%, #000 30%, transparent 75%)" }} />
      )}
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes lgateBounce { 0%,100% { transform: translateY(0); opacity: .95; } 50% { transform: translateY(-7px); opacity: 1; } }
@keyframes lgateGlow { 0%,100% { opacity: .55; transform: translate(0,0) scale(1); } 50% { opacity: .85; transform: translate(0,-12px) scale(1.08); } }
.lgate-chevron { animation: lgateBounce 1.4s ease-in-out infinite; will-change: transform; }
.lgate-glow { animation: lgateGlow 6s ease-in-out infinite; }
.lgate-inner { transition: transform .5s ease-out, opacity .5s ease-out, filter .5s ease-out; }
@media (prefers-reduced-motion: reduce) {
  .lgate-chevron, .lgate-glow { animation: none; }
}
`,
        }}
      />

      {/* glow de fondo en el color de la campaña */}
      <div
        aria-hidden
        className="lgate-glow"
        style={{
          position: "absolute",
          top: "18%",
          left: "50%",
          width: 420,
          height: 420,
          marginLeft: -210,
          borderRadius: "50%",
          pointerEvents: "none",
          background: `radial-gradient(circle, color-mix(in oklch, ${primary} 38%, transparent) 0%, transparent 70%)`,
        }}
      />

      <div
        className="lgate-inner"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          transform: leaving ? "translateY(-64px)" : "translateY(0)",
          opacity: leaving ? 0 : 1,
          filter: leaving ? "blur(6px)" : "blur(0)",
        }}
      >
        {isV2 && (logoUrl || brand) && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 26 }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={brand ?? ""} style={{ height: 34, width: "auto", maxWidth: 120, objectFit: "contain", borderRadius: 9 }} />
            ) : (
              <span style={{ width: 30, height: 30, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: headFont, fontWeight: 700, fontSize: 16, color: "#04140b", background: primary }}>{(brand?.charAt(0) ?? "F").toUpperCase()}</span>
            )}
            {brand && <span style={{ fontFamily: headFont, fontWeight: 700, fontSize: 20, letterSpacing: "-0.03em" }}>{brand}</span>}
          </div>
        )}

        <h1
          style={{
            fontFamily: headFont,
            fontSize: isV2 ? 34 : 32,
            fontWeight: isV2 ? 700 : 800,
            lineHeight: 1.12,
            letterSpacing: "-0.03em",
            margin: 0,
            maxWidth: "16ch",
            textShadow: "0 2px 18px rgba(0,0,0,0.4)",
          }}
        >
          {headlineA}
          <span style={{ color: primary }}>{headlineHighlight}</span>
          {headlineB}
        </h1>

        {/* Swipe cue */}
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              filter: `drop-shadow(0 0 12px color-mix(in oklch, ${primary} 60%, transparent))`,
            }}
          >
            <ChevronUp className="lgate-chevron" strokeWidth={2.5} style={{ width: 28, height: 28, color: primary, animationDelay: "0s" }} />
            <ChevronUp className="lgate-chevron" strokeWidth={2.5} style={{ width: 28, height: 28, marginTop: -16, color: primary, opacity: 0.7, animationDelay: "0.2s" }} />
            <ChevronUp className="lgate-chevron" strokeWidth={2.5} style={{ width: 28, height: 28, marginTop: -16, color: primary, opacity: 0.4, animationDelay: "0.4s" }} />
          </div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 500, letterSpacing: "0.02em", color: "rgba(255,255,255,0.65)" }}>
            {swipe}
          </p>
        </div>
      </div>
    </div>
  );
}
