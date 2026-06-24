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
const TIP_MS      = 4200;   // rotación de tips
const MUSIC_SRC   = "/intro/gta-loading.mp3";
const PRELOAD_MAX = 12000;  // tope de espera de buffering (ms)
const BAR         = "9vh";  // alto de barras cinematográficas

/* Fuente gangster estilo GTA */
const GANGSTER = "'Pricedown', 'Arial Black', Impact, sans-serif";

/* ─── Tips de TikTok Ads ─── */
const TIPS = [
  "Los primeros 3 segundos definen si el usuario se queda. Enganchá al instante.",
  "El contenido tipo UGC (usuario real) convierte más que lo demasiado producido.",
  "Probá 3 a 5 creativos por campaña y dejá que el algoritmo elija el ganador.",
  "Usá audios trending de TikTok: el sonido sube el alcance orgánico.",
  "Mostrá la recompensa ya: «¿Querés ganar dinero jugando?» en el primer frame.",
  "Verticales 9:16 a pantalla completa. Nada de bordes negros ni reciclar de otras redes.",
  "Renová el creativo cada 5 a 7 días para evitar la fatiga de anuncio.",
  "Spark Ads: amplificá publicaciones orgánicas que ya están funcionando.",
  "CTA claro y directo: «descargá», «probá gratis», «mirá esto».",
  "Hablá nativo de la plataforma: que el ad no parezca un ad.",
];

/* ═══════════════════════════════════════════════
   GTA V loading wheel (sweep ring)
═══════════════════════════════════════════════ */
function LoadingWheel({ label = "Cargando" }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          fontFamily: GANGSTER,
          fontSize: 20,
          letterSpacing: 1,
          color: "rgba(255,255,255,0.95)",
          textShadow: "0 1px 6px rgba(0,0,0,0.85)",
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
  const [idx, setIdx]       = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [phase, setPhase]   = useState<"preloading" | "loading" | "welcome">("preloading");
  const audioRef            = useRef<HTMLAudioElement>(null);

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

  /* ── Rotación de tips ── */
  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), TIP_MS);
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
      {/* Fuente gangster estilo GTA */}
      <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/pricedown" />

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
                transform: i === idx ? "scale(1.13)" : "scale(1)",
                transition: "opacity 1.2s ease, transform 7s ease-out",
                willChange: "transform, opacity",
              }}
            />
          ))}

          {/* Vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.5) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* Barras cinematográficas */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: BAR, background: "#000", zIndex: 5 }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: BAR, background: "#000", zIndex: 5 }} />

          {/* Tip TikTok Ads — bajo la barra superior */}
          <div
            style={{
              position: "absolute",
              top: `calc(${BAR} + 26px)`,
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(640px, 82%)",
              textAlign: "center",
              zIndex: 6,
            }}
          >
            <p
              style={{
                fontFamily: GANGSTER,
                fontSize: 22,
                letterSpacing: 1.5,
                color: "#ffd23f",
                textShadow: "0 2px 10px rgba(0,0,0,0.9)",
                marginBottom: 8,
              }}
            >
              TIP · TIKTOK ADS
            </p>
            <p
              key={tipIdx}
              style={{
                fontSize: 15,
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.94)",
                textShadow: "0 1px 8px rgba(0,0,0,0.95)",
                animation: "tipFade 0.6s ease",
              }}
            >
              {TIPS[tipIdx]}
            </p>
          </div>

          {/* Logo gangster bottom-left */}
          <div
            style={{
              position: "absolute",
              left: 40,
              bottom: `calc(${BAR} + 16px)`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              zIndex: 6,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="TapSur"
              style={{ width: 50, height: 50, borderRadius: 8, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7))" }}
            />
            <span
              style={{
                fontFamily: GANGSTER,
                fontSize: 42,
                letterSpacing: 1,
                color: "#fff",
                textShadow: "0 2px 14px rgba(0,0,0,0.85)",
              }}
            >
              TapSur
            </span>
          </div>

          {/* Loading wheel bottom-right */}
          <div style={{ position: "absolute", right: 40, bottom: `calc(${BAR} + 18px)`, zIndex: 6 }}>
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
              fontFamily: GANGSTER,
              fontSize: 52,
              letterSpacing: 1,
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
        @keyframes tipFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
