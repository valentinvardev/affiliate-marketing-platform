"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Config ─── */
const SLIDES = [
  "/intro/intro1.png",
  "/intro/intro2.png",
  "/intro/intro3.png",
  "/intro/intro4.jpg",
];
const SLIDE_MS = 3000;   // duración de cada diapositiva
const CYCLES   = 2;      // todas las diapositivas + 1 repetición
const MUSIC_SRC = "/intro/gta-loading.mp3";

/* ═══════════════════════════════════════════════
   GTA V loading wheel (sweep ring)
═══════════════════════════════════════════════ */
function LoadingWheel() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: 0.3,
          color: "rgba(255,255,255,0.92)",
          textShadow: "0 1px 4px rgba(0,0,0,0.8)",
        }}
      >
        Cargando
      </span>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          background:
            "conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0) 200deg, rgba(255,255,255,0.95) 350deg, rgba(255,255,255,0) 360deg)",
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))",
          mask:
            "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 4px))",
          animation: "gtaSpin 0.9s linear infinite",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Intro sequence: loading slideshow → welcome
═══════════════════════════════════════════════ */
export function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const [idx, setIdx]     = useState(0);
  const [phase, setPhase] = useState<"loading" | "welcome">("loading");
  const audioRef          = useRef<HTMLAudioElement>(null);

  /* Preload images */
  useEffect(() => {
    SLIDES.forEach((src) => { const img = new Image(); img.src = src; });
  }, []);

  /* Music — autoplay with fallback on first interaction */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0.55;
    void a.play().catch(() => {
      const start = () => { void a.play().catch(() => {}); cleanup(); };
      const cleanup = () => {
        window.removeEventListener("pointerdown", start);
        window.removeEventListener("keydown", start);
      };
      window.addEventListener("pointerdown", start);
      window.addEventListener("keydown", start);
    });
  }, []);

  /* Slideshow driver — runs all slides × CYCLES, then → welcome */
  useEffect(() => {
    if (phase !== "loading") return;
    const total = SLIDES.length * CYCLES;
    let count = 1;
    const t = setInterval(() => {
      count += 1;
      setIdx((i) => (i + 1) % SLIDES.length);
      if (count >= total) {
        clearInterval(t);
        setTimeout(() => setPhase("welcome"), SLIDE_MS);
      }
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, [phase]);

  /* Welcome → fade out music, then complete */
  useEffect(() => {
    if (phase !== "welcome") return;
    const a = audioRef.current;
    let v = a?.volume ?? 0;
    const fade = setInterval(() => {
      if (!a) return clearInterval(fade);
      v = Math.max(0, v - 0.05);
      a.volume = v;
      if (v <= 0) { a.pause(); clearInterval(fade); }
    }, 90);
    const done = setTimeout(onComplete, 2800);
    return () => { clearInterval(fade); clearTimeout(done); };
  }, [phase, onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        overflow: "hidden",
      }}
    >
      {/* ─── LOADING PHASE ─── */}
      {phase === "loading" && (
        <>
          {/* Slides */}
          {SLIDES.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: i === idx ? 1 : 0,
                transform: i === idx ? "scale(1.06)" : "scale(1)",
                transition: "opacity 1s ease, transform 4s ease",
              }}
            />
          ))}

          {/* Vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* GTA-style logo bottom-left */}
          <div
            style={{
              position: "absolute",
              left: 40,
              bottom: 36,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="TapSur"
              style={{ width: 52, height: 52, borderRadius: 8, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7))" }}
            />
            <span
              style={{
                fontSize: 34,
                fontWeight: 900,
                letterSpacing: -1,
                color: "#fff",
                textShadow: "0 2px 12px rgba(0,0,0,0.8)",
                fontStyle: "italic",
              }}
            >
              TapSur
            </span>
          </div>

          {/* Loading wheel bottom-right */}
          <div style={{ position: "absolute", right: 40, bottom: 40 }}>
            <LoadingWheel />
          </div>
        </>
      )}

      {/* ─── WELCOME PHASE ─── */}
      {phase === "welcome" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            background: "var(--color-background, #000)",
            animation: "introFadeIn 0.8s ease",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="TapSur"
            style={{
              width: 72,
              height: 72,
              borderRadius: 14,
              animation: "introRise 0.9s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
          <h1
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: -1.5,
              color: "var(--color-foreground, #fff)",
              animation: "introRise 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both",
            }}
          >
            Bienvenido a TapSur
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--color-muted-foreground, #888)",
              animation: "introRise 0.9s cubic-bezier(0.16,1,0.3,1) 0.2s both",
            }}
          >
            Preparando tu panel…
          </p>
        </div>
      )}

      {/* Music */}
      <audio ref={audioRef} src={MUSIC_SRC} loop preload="auto" />

      {/* Keyframes */}
      <style>{`
        @keyframes gtaSpin { to { transform: rotate(360deg); } }
        @keyframes introFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes introRise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
