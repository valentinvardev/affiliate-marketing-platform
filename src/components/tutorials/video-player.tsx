"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Loader2, RotateCcw, RotateCw } from "lucide-react";
import { t } from "@/lib/i18n-client";

export type Chapter = { id: string; timeSec: number; title: string };

export function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/**
 * Reproductor propio (sin dependencias): controles custom, marcadores de
 * capítulo sobre la barra de progreso y estados de carga explícitos.
 *
 * `seekTo` permite que el índice de la derecha salte a un capítulo; el padre
 * cambia ese valor y acá se aplica.
 */
export function VideoPlayer({
  src, poster, chapters = [], seekTo, onTime, onDuration, onChapterChange,
}: {
  src: string;
  poster?: string | null;
  chapters?: Chapter[];
  /** {sec, nonce} — el nonce fuerza el salto aunque se repita el mismo segundo. */
  seekTo?: { sec: number; nonce: number } | null;
  onTime?: (sec: number) => void;
  onDuration?: (sec: number) => void;
  onChapterChange?: (index: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [waiting, setWaiting] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* Salto desde el índice */
  useEffect(() => {
    const v = ref.current;
    if (!v || !seekTo) return;
    v.currentTime = seekTo.sec;
    setCur(seekTo.sec);
    void v.play().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekTo?.nonce]);

  /* Capítulo activo */
  const activeIdx = chapters.length
    ? chapters.reduce((acc, c, i) => (cur + 0.25 >= c.timeSec ? i : acc), -1)
    : -1;
  useEffect(() => { onChapterChange?.(activeIdx); }, [activeIdx, onChapterChange]);

  const toggle = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => undefined);
    else v.pause();
  }, []);

  const skip = useCallback((delta: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
  }, []);

  /* Atajos de teclado */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); }
      else if (e.key === "ArrowRight") skip(5);
      else if (e.key === "ArrowLeft") skip(-5);
      else if (e.key === "m") setMuted((m) => { if (ref.current) ref.current.muted = !m; return !m; });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, skip]);

  /* Auto-ocultar controles mientras reproduce */
  const bump = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (ref.current && !ref.current.paused) setShowControls(false);
    }, 2600);
  }, []);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  function onScrub(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    const v = ref.current;
    const bar = e.currentTarget;
    if (!v || !dur) return;
    const rect = bar.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0]!.clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    v.currentTime = pct * dur;
    setCur(pct * dur);
  }

  const pct = dur ? (cur / dur) * 100 : 0;
  const bufPct = dur ? (buffered / dur) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      className="tut-player"
      onMouseMove={bump}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
      style={{
        position: "relative", width: "100%", aspectRatio: "16 / 9",
        background: "#07080c", borderRadius: 14, overflow: "hidden",
        border: "1px solid var(--color-border)",
      }}
    >
      <video
        ref={ref}
        src={src}
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        onClick={toggle}
        onPlay={() => { setPlaying(true); bump(); }}
        onPause={() => { setPlaying(false); setShowControls(true); }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => { setWaiting(false); setReady(true); }}
        onCanPlay={() => { setWaiting(false); setReady(true); }}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDur(d); onDuration?.(d);
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setCur(v.currentTime);
          onTime?.(v.currentTime);
          if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
        }}
        onError={() => { setError(true); setWaiting(false); }}
        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", cursor: "pointer" }}
      />

      {/* Carga / error */}
      {(waiting || !ready) && !error && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: ready ? "rgba(7,8,12,0.35)" : "rgba(7,8,12,0.75)", pointerEvents: "none",
        }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#fff", opacity: 0.9 }} />
        </div>
      )}
      {error && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 8,
          alignItems: "center", justifyContent: "center", background: "rgba(7,8,12,0.9)",
          color: "var(--color-muted-foreground)", fontSize: 13, padding: 20, textAlign: "center",
        }}>
          {t("No se pudo cargar el video.")}
        </div>
      )}

      {/* Botón central de play cuando está pausado */}
      {!playing && ready && !error && (
        <button
          type="button"
          onClick={toggle}
          aria-label={t("Reproducir")}
          style={{
            position: "absolute", inset: 0, margin: "auto", width: 68, height: 68, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.28)",
            backdropFilter: "blur(6px)", color: "#fff", animation: "tutPop .22s cubic-bezier(.2,.8,.2,1) both",
          }}
        >
          <Play className="h-7 w-7" style={{ marginLeft: 4 }} fill="currentColor" />
        </button>
      )}

      {/* Controles */}
      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0, padding: "26px 12px 10px",
          background: "linear-gradient(to top, rgba(0,0,0,0.82), transparent)",
          opacity: showControls || !playing ? 1 : 0,
          transform: showControls || !playing ? "none" : "translateY(8px)",
          transition: "opacity .22s ease, transform .22s ease",
          pointerEvents: showControls || !playing ? "auto" : "none",
        }}
      >
        {/* Barra de progreso con marcadores de capítulo */}
        <div
          onClick={onScrub}
          onTouchStart={onScrub}
          role="slider"
          aria-label={t("Progreso")}
          aria-valuemin={0}
          aria-valuemax={Math.round(dur)}
          aria-valuenow={Math.round(cur)}
          tabIndex={0}
          style={{ position: "relative", height: 16, display: "flex", alignItems: "center", cursor: "pointer" }}
        >
          <div style={{ position: "relative", width: "100%", height: 4, borderRadius: 999, background: "rgba(255,255,255,0.24)" }}>
            <div style={{ position: "absolute", inset: 0, width: `${bufPct}%`, background: "rgba(255,255,255,0.34)", borderRadius: 999 }} />
            <div style={{ position: "absolute", inset: 0, width: `${pct}%`, background: "var(--color-foreground)", borderRadius: 999 }} />
            {/* marcadores */}
            {dur > 0 && chapters.map((c) => (
              <span
                key={c.id}
                title={c.title}
                style={{
                  position: "absolute", top: -2, left: `${(c.timeSec / dur) * 100}%`,
                  width: 3, height: 8, borderRadius: 2, transform: "translateX(-1px)",
                  background: "rgba(255,255,255,0.85)", boxShadow: "0 0 0 1px rgba(0,0,0,0.35)",
                }}
              />
            ))}
            {/* thumb */}
            <span style={{
              position: "absolute", top: "50%", left: `${pct}%`, width: 11, height: 11, borderRadius: "50%",
              transform: "translate(-50%,-50%)", background: "var(--color-foreground)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
            }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2, color: "#fff" }}>
          <Ctrl onClick={toggle} label={playing ? t("Pausar") : t("Reproducir")}>
            {playing ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4" fill="currentColor" />}
          </Ctrl>
          <Ctrl onClick={() => skip(-10)} label={t("Retroceder 10 s")}><RotateCcw className="h-4 w-4" /></Ctrl>
          <Ctrl onClick={() => skip(10)} label={t("Adelantar 10 s")}><RotateCw className="h-4 w-4" /></Ctrl>
          <Ctrl
            onClick={() => setMuted((m) => { if (ref.current) ref.current.muted = !m; return !m; })}
            label={muted ? t("Activar sonido") : t("Silenciar")}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Ctrl>
          <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", opacity: 0.9 }}>
            {fmtTime(cur)} / {fmtTime(dur)}
          </span>
          <div style={{ flex: 1 }} />
          <Ctrl
            onClick={() => {
              const el = wrapRef.current;
              if (!el) return;
              if (document.fullscreenElement) void document.exitFullscreen();
              else void el.requestFullscreen?.().catch(() => undefined);
            }}
            label={t("Pantalla completa")}
          >
            <Maximize className="h-4 w-4" />
          </Ctrl>
        </div>
      </div>
    </div>
  );
}

function Ctrl({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="tut-ctrl"
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 30, height: 30, borderRadius: 8, color: "#fff", cursor: "pointer",
        background: "transparent", border: "none", transition: "background .15s ease",
      }}
    >
      {children}
    </button>
  );
}
