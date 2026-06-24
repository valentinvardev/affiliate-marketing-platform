"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Config ─── */
const SLIDES = [
  "/intro/intro1.png",
  "/intro/intro2.png",
  "/intro/intro3.png",
  "/intro/intro4.jpg",
];
const SLIDE_MS    = 3000;   // duración de cada diapositiva
const CYCLES      = 2;      // todas las diapositivas + 1 repetición
const MUSIC_SRC   = "/intro/gta-loading.mp3";
const PRELOAD_MAX = 12000;  // tope de espera de buffering (ms)

/* ═══════════════════════════════════════════════
   GTA V loading wheel (sweep ring)
═══════════════════════════════════════════════ */
function LoadingWheel({ label = "Cargando" }: { label?: string }) {
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
        {label}
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
   Intro sequence: preload → loading slideshow → welcome
═══════════════════════════════════════════════ */
export function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const [idx, setIdx]     = useState(0);
  const [phase, setPhase] = useState<"preloading" | "loading" | "welcome">("preloading");
  const audioRef          = useRef<HTMLAudioElement>(null);

  /* ── Preload everything (images + audio), then start ── */
  useEffect(() => {
    let started = false;
    const imagesReady = { v: false };
    const audioReady  = { v: false };

    function tryStart() {
      if (started) return;
      if (!(imagesReady.v && audioReady.v)) return;
      begin();
    }

    function begin() {
      if (started) return;
      started = true;
      clearTimeout(safety);
      const a = audioRef.current;
      if (a) {
        a.volume = 0.55;
        a.currentTime = 0;
        void a.play().catch(() => {
          // Autoplay bloqueado → arrancar en la primera interacción
          const start = () => { void a.play().catch(() => {}); cleanup(); };
          const cleanup = () => {
            window.removeEventListener("pointerdown", start);
            window.removeEventListener("keydown", start);
          };
          window.addEventListener("pointerdown", start);
          window.addEventListener("keydown", start);
        });
      }
      setPhase("loading");
    }

    // Preload images
    void Promise.all(
      SLIDES.map(
        (src) =>
          new Promise<void>((res) => {
            const img = new Image();
            img.onload = () => res();
            img.onerror = () => res();
            img.src = src;
          }),
      ),
    ).then(() => { imagesReady.v = true; tryStart(); });

    // Preload audio (wait until fully buffered)
    const a = audioRef.current;
    if (a) {
      const onReady = () => { audioReady.v = true; tryStart(); };
      if (a.readyState >= 4) {
        onReady();
      } else {
        a.addEventListener("canplaythrough", onReady, { once: true });
        a.addEventListener("error", onReady, { once: true }); // si falta el archivo, seguir igual
        a.load();
      }
    } else {
      audioReady.v = true;
    }

    // Safety: nunca bloquear más que PRELOAD_MAX
    const safety = setTimeout(begin, PRELOAD_MAX);
    return () => clearTimeout(safety);
  }, []);

  /* ── Slideshow driver — corre todas las slides × CYCLES, luego → welcome ── */
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

  /* ── Welcome → fade out música, luego completar ── */
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
      {/* ─── PRELOAD PHASE ─── */}
      {phase === "preloading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LoadingWheel />
        </div>
      )}

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

      {/* Música */}
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
