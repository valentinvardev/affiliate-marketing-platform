"use client";

import { useEffect, useRef, useState } from "react";

/* ─── Config ─── */
const SLIDES = [
  "/intro/intro1.png",
  "/intro/intro2.png",
  "/intro/intro3.png",
  "/intro/intro4.jpg",
  "/intro/intro5.png",
];
const SLIDE_MS    = 3600;   // duración de cada diapositiva
const TIP_MS      = 7000;   // rotación de tips
const TOTAL_MS    = 23000;  // duración total de la intro (load → interfaz)
const FADE_MS     = 5000;   // fade-out de música en los últimos 5s
const MUSIC_SRC   = "/intro/intro-music.mp3";
const PRELOAD_MAX = 12000;  // tope de espera de buffering (ms)
const BAR         = "9vh";  // alto de barras cinematográficas

/* Fuente gangster estilo GTA (pantalla de carga) */
const GANGSTER = "'Pricedown', 'Arial Black', Impact, sans-serif";
/* Fuente de títulos (pantalla de bienvenida) — Satoshi, fallback Poppins */
const TITLE = "'Satoshi', 'Poppins', system-ui, sans-serif";

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
function LoadingWheel({ label = "Cargando", size = 42 }: { label?: string; size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          fontFamily: GANGSTER,
          fontSize: size < 40 ? 16 : 20,
          letterSpacing: 1,
          color: "rgba(255,255,255,0.95)",
          textShadow: "0 1px 6px rgba(0,0,0,0.85)",
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: size,
          height: size,
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
  const [isMobile, setIsMobile] = useState(false);
  const audioRef            = useRef<HTMLAudioElement>(null);

  /* ── Detección de viewport móvil ── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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

  /* ── Slideshow loop + paso a welcome a los (TOTAL − FADE) ── */
  useEffect(() => {
    if (phase !== "loading") return;
    const slide = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    const toWelcome = setTimeout(() => setPhase("welcome"), TOTAL_MS - FADE_MS);
    return () => { clearInterval(slide); clearTimeout(toWelcome); };
  }, [phase]);

  /* ── Rotación de tips ── */
  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), TIP_MS);
    return () => clearInterval(t);
  }, [phase]);

  /* ── Welcome → fade out música durante FADE_MS, luego completar ── */
  useEffect(() => {
    if (phase !== "welcome") return;
    const a = audioRef.current;
    const startVol = a?.volume ?? 0;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / FADE_MS);
      if (a) a.volume = startVol * (1 - p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else if (a) a.pause();
    };
    raf = requestAnimationFrame(tick);
    const done = setTimeout(onComplete, FADE_MS);
    return () => { cancelAnimationFrame(raf); clearTimeout(done); };
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
      {/* Fuentes: gangster (carga) + títulos (bienvenida) */}
      <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/pricedown" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
      />

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
                objectFit: isMobile ? "contain" : "cover",
                opacity: i === idx ? 1 : 0,
                transform: i === idx ? (isMobile ? "scale(1.06)" : "scale(1.14)") : "scale(1)",
                transition: "opacity 2.2s ease, transform 9s ease-out",
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

          {/* Barra cinematográfica superior */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: isMobile ? "6vh" : BAR, background: "#000", zIndex: 5 }} />

          {/* Degradé negro inferior */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "36vh",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.6) 45%, transparent 100%)",
              zIndex: 4,
              pointerEvents: "none",
            }}
          />

          {/* Logo — bottom-left (desktop) / top-left bajo la barra (móvil) */}
          <div
            style={
              isMobile
                ? { position: "absolute", left: 16, top: "calc(6vh + 12px)", zIndex: 6 }
                : { position: "absolute", left: 40, bottom: 34, zIndex: 6 }
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="TapSur"
              style={{
                width: isMobile ? 76 : 104,
                height: isMobile ? 76 : 104,
                mixBlendMode: "screen",
              }}
            />
          </div>

          {/* Rueda + tips — bottom-right (desktop) / centrado abajo (móvil) */}
          <div
            style={{
              position: "absolute",
              bottom: isMobile ? 24 : 34,
              zIndex: 6,
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? 10 : 14,
              ...(isMobile
                ? { left: 16, right: 16, alignItems: "center" }
                : { right: 40, alignItems: "flex-end", maxWidth: 420 }),
            }}
          >
            <LoadingWheel size={isMobile ? 32 : 42} />
            <div style={{ textAlign: isMobile ? "center" : "right", width: isMobile ? "100%" : undefined }}>
              <p
                key={tipIdx}
                style={{
                  fontSize: isMobile ? 11.5 : 12.5,
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,0.92)",
                  textShadow: "0 1px 6px rgba(0,0,0,0.95)",
                  animation: "tipFade 1.1s ease",
                  ...(isMobile ? { maxWidth: "92vw", margin: "0 auto" } : {}),
                }}
              >
                {TIPS[tipIdx]}
              </p>
            </div>
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
            padding: "0 24px",
            textAlign: "center",
            background: "var(--color-background, #000)",
            animation: "introFadeIn 0.8s ease",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="TapSur"
            style={{
              width: isMobile ? 112 : 144,
              height: isMobile ? 112 : 144,
              mixBlendMode: "screen",
              animation: "introRise 0.9s cubic-bezier(0.16,1,0.3,1)",
            }}
          />
          <h1
            style={{
              fontFamily: TITLE,
              fontWeight: 700,
              fontSize: isMobile ? 34 : 56,
              letterSpacing: isMobile ? -1 : -1.8,
              lineHeight: 1.05,
              color: "var(--color-foreground, #fff)",
              animation: "introRise 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both",
            }}
          >
            Bienvenido a TapSur
          </h1>
          <p
            style={{
              fontFamily: TITLE,
              fontWeight: 400,
              fontSize: 15,
              letterSpacing: 0.2,
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
