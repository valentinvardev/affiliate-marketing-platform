"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import ReactCountryFlag from "react-country-flag";
import { X, Plus, Search, Clock } from "lucide-react";
import { TARGET_COUNTRIES, localClock, isOperable, OP_LABEL, type TargetCountry } from "@/lib/target-countries";

type Geometry = { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
type Feature = { id: string; properties: { name: string }; geometry: Geometry };
type FC = { features: Feature[] };

/* ── Globo: proyección ortográfica ── */
const SIZE = 640, CX = SIZE / 2, CY = SIZE / 2, R = 300;
const DEG = Math.PI / 180;

type Rot = { lam: number; phi: number };

function ortho(lon: number, lat: number, rot: Rot) {
  const λ = lon * DEG, φ = lat * DEG, λ0 = rot.lam * DEG, φ0 = rot.phi * DEG;
  const cosc = Math.sin(φ0) * Math.sin(φ) + Math.cos(φ0) * Math.cos(φ) * Math.cos(λ - λ0);
  const x = R * Math.cos(φ) * Math.sin(λ - λ0);
  const y = R * (Math.cos(φ0) * Math.sin(φ) - Math.sin(φ0) * Math.cos(φ) * Math.cos(λ - λ0));
  return { x: CX + x, y: CY - y, cosc };
}

/**
 * Dibuja un anillo SOLO si su centroide (en 3D) cae en la cara visible del globo.
 * Así los anillos de la cara oculta (y los que apenas rozan el terminador) se
 * descartan enteros — nada de slivers ni rayas. Para un anillo centroide-visible,
 * todos sus vértices proyectan dentro del disco (radio ≤ R), así que el polígono
 * plano queda contenido y limpio.
 */
function ringPath(ring: number[][], rot: Rot): string {
  const n = ring.length;
  if (n < 3) return "";
  const λ0 = rot.lam * DEG, φ0 = rot.phi * DEG;
  const v0x = Math.cos(φ0) * Math.cos(λ0), v0y = Math.cos(φ0) * Math.sin(λ0), v0z = Math.sin(φ0);
  let cx = 0, cy = 0, cz = 0;
  for (const p of ring) {
    const λ = p[0]! * DEG, φ = p[1]! * DEG, cphi = Math.cos(φ);
    cx += cphi * Math.cos(λ); cy += cphi * Math.sin(λ); cz += Math.sin(φ);
  }
  if (cx * v0x + cy * v0y + cz * v0z <= 0) return ""; // centroide en la cara oculta
  let d = "";
  for (let i = 0; i < n; i++) {
    const o = ortho(ring[i]![0]!, ring[i]![1]!, rot);
    d += (i === 0 ? "M" : "L") + o.x.toFixed(1) + "," + o.y.toFixed(1);
  }
  return d + "Z";
}
function geomPath(g: Geometry, rot: Rot): string {
  if (g.type === "Polygon") return (g.coordinates as number[][][]).map((r) => ringPath(r, rot)).join("");
  return (g.coordinates as number[][][][]).flatMap((poly) => poly.map((r) => ringPath(r, rot))).join("");
}

/* Retícula (meridianos + paralelos), cortando en el horizonte. */
function graticule(rot: Rot): string {
  const seg: string[] = [];
  const line = (pts: [number, number][]) => {
    let d = "", pen = false;
    for (const [lo, la] of pts) {
      const p = ortho(lo, la, rot);
      if (p.cosc < 0) { pen = false; continue; }
      d += (pen ? "L" : "M") + p.x.toFixed(1) + "," + p.y.toFixed(1); pen = true;
    }
    if (d) seg.push(d);
  };
  for (let lo = -180; lo < 180; lo += 30) { const pts: [number, number][] = []; for (let la = -90; la <= 90; la += 4) pts.push([lo, la]); line(pts); }
  for (let la = -60; la <= 60; la += 30) { const pts: [number, number][] = []; for (let lo = -180; lo <= 180; lo += 4) pts.push([lo, la]); line(pts); }
  return seg.join("");
}

const TARGET_BY_ID = new Map(TARGET_COUNTRIES.map((c) => [c.id, c]));

export function OpsMap() {
  const [fc, setFc] = useState<FC | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState<TargetCountry | null>(null);
  const [rot, setRot] = useState<Rot>({ lam: -40, phi: 40 });

  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/world-geo.json").then((r) => r.json()).then((d: FC) => { if (alive) setFc(d); }).catch(() => {});
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const rows = useMemo(() => TARGET_COUNTRIES.map((c) => {
    const { minutes, label } = localClock(c.timezone, now);
    return { c, label, open: isOperable(minutes) };
  }).sort((a, b) => (a.open === b.open ? a.c.name.localeCompare(b.c.name) : a.open ? -1 : 1)), [now]);
  const openById = useMemo(() => new Map(rows.map((r) => [r.c.id, r.open])), [rows]);
  const openCount = rows.filter((r) => r.open).length;

  const grat = useMemo(() => graticule(rot), [rot]);
  const paths = useMemo(() => fc?.features.map((f) => ({ id: f.id, d: geomPath(f.geometry, rot) })).filter((p) => p.d) ?? [], [fc, rot]);

  function onDown(e: React.PointerEvent) { drag.current = { x: e.clientX, y: e.clientY, moved: false }; (e.target as Element).setPointerCapture?.(e.pointerId); }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
    drag.current.x = e.clientX; drag.current.y = e.clientY;
    // La superficie sigue al cursor (arrastrar a la derecha → el globo gira a la derecha).
    setRot((r) => ({ lam: r.lam - dx * 0.4, phi: Math.max(-85, Math.min(85, r.phi + dy * 0.4)) }));
  }
  function onUp() { drag.current = null; }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Globo ── */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Mapa de operaciones</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-success)" }} />
            {openCount} operando
          </span>
          <span className="ml-auto hidden text-[11px] sm:inline" style={{ color: "var(--color-subtle)" }}>Arrastrá para rotar · operable {OP_LABEL} local</span>
        </header>

        <div className="flex flex-1 items-center justify-center p-4 md:p-8">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full select-none" style={{ maxHeight: "74vh", touchAction: "none", cursor: drag.current ? "grabbing" : "grab" }}
            role="img" aria-label="Globo de países objetivo"
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
            <defs>
              <radialGradient id="ocean" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="#15171b" />
                <stop offset="70%" stopColor="#0c0d10" />
                <stop offset="100%" stopColor="#070708" />
              </radialGradient>
              <radialGradient id="atmo" cx="50%" cy="50%" r="50%">
                <stop offset="92%" stopColor="rgba(120,160,220,0)" />
                <stop offset="100%" stopColor="rgba(120,160,220,0.18)" />
              </radialGradient>
            </defs>

            {/* atmósfera + océano */}
            <circle cx={CX} cy={CY} r={R + 14} fill="url(#atmo)" />
            <circle cx={CX} cy={CY} r={R} fill="url(#ocean)" stroke="var(--color-border)" strokeWidth={1} />

            {/* retícula */}
            <path d={grat} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.6} />

            {/* países */}
            {paths.map((p) => {
              const target = TARGET_BY_ID.get(p.id);
              const open = target ? openById.get(p.id) : false;
              const fill = !target ? "#23262c" : open ? "var(--color-success)" : "var(--color-surface-overlay)";
              const stroke = !target ? "rgba(0,0,0,0.4)" : open ? "rgba(255,255,255,0.5)" : "var(--color-subtle)";
              return (
                <path key={p.id} d={p.d}
                  className={open ? "ops-open" : undefined}
                  onClick={target && open ? () => { if (!drag.current?.moved) setSelected(target); } : undefined}
                  style={{
                    fill, stroke, strokeWidth: 0.5,
                    fillOpacity: !target ? 1 : open ? 0.92 : 0.9,
                    cursor: target && open ? "pointer" : "inherit",
                    transition: "fill .3s ease, fill-opacity .3s ease",
                  }}>
                  <title>{target ? `${target.name}${open ? " · operando" : " · cerrado"}` : ""}</title>
                </path>
              );
            })}

            {/* brillo del limbo */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={1.5} />
          </svg>
        </div>
      </main>

      {/* ── Sidebar de horas ── */}
      <aside className="shrink-0 lg:w-72 lg:overflow-y-auto" style={{ borderTop: "1px solid var(--color-border)", borderLeft: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        <div className="flex h-14 items-center gap-2 px-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <Clock className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
          <span className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--color-subtle)" }}>Hora local</span>
        </div>
        <ul>
          {rows.map(({ c, label, open }) => (
            <li key={c.id}>
              <button type="button" disabled={!open} onClick={() => open && setSelected(c)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors disabled:cursor-default"
                style={{ borderBottom: "1px solid var(--color-border)", opacity: open ? 1 : 0.55 }}
                onMouseEnter={(e) => { if (open) e.currentTarget.style.background = "var(--color-surface-overlay)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <ReactCountryFlag countryCode={c.code} svg style={{ width: "1.35em", height: "1em", borderRadius: 2, flexShrink: 0 }} />
                <span className="min-w-0 flex-1 truncate text-sm" style={{ color: "var(--color-foreground)" }}>{c.name}</span>
                <span className="font-mono text-xs tabular-nums" style={{ color: "var(--color-muted-foreground)" }}>{label}</span>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: open ? "var(--color-success)" : "var(--color-subtle)" }} title={open ? "Operando" : "Cerrado"} />
              </button>
            </li>
          ))}
        </ul>
        <p className="px-4 py-3 text-[11px] leading-relaxed" style={{ color: "var(--color-subtle)" }}>
          Operable de {OP_LABEL} hora local. Clickeá un país abierto para crear campaña o buscar un spark.
        </p>
      </aside>

      {selected && <CountryModal country={selected} now={now} onClose={() => setSelected(null)} />}

      <style>{`
        .ops-open { filter: drop-shadow(0 0 5px var(--color-success)); }
        @media (prefers-reduced-motion: reduce) { .ops-open { filter: none; } }
      `}</style>
    </div>
  );
}

/* ── Modal de acciones del país ── */
function CountryModal({ country, now, onClose }: { country: TargetCountry; now: Date; onClose: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const { label } = localClock(country.timezone, now);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: show ? "blur(8px)" : "blur(0px)", WebkitBackdropFilter: show ? "blur(8px)" : "blur(0px)", opacity: show ? 1 : 0, transition: "opacity .2s ease, backdrop-filter .2s ease" }}>
      <div className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", opacity: show ? 1 : 0, transform: show ? "translateY(0) scale(1)" : "translateY(8px) scale(0.97)", transition: "opacity .2s ease, transform .25s cubic-bezier(0.22,1,0.36,1)" }}>
        <div className="flex items-center gap-3">
          <ReactCountryFlag countryCode={country.code} svg style={{ width: "2em", height: "1.5em", borderRadius: 3 }} />
          <div className="min-w-0">
            <p className="text-base font-semibold" style={{ fontFamily: "var(--font-brand)", color: "var(--color-foreground)" }}>{country.name}</p>
            <p className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-success)" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-success)" }} />
              Operando · {label} local
            </p>
          </div>
          <button type="button" onClick={onClose} className="ml-auto" style={{ color: "var(--color-subtle)" }}><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2">
          <Link href="/campaigns/new"
            className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
            <Plus className="h-4 w-4" /> Crear campaña
          </Link>
          <Link href="/sparks"
            className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
            <Search className="h-4 w-4" /> Buscar spark
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
