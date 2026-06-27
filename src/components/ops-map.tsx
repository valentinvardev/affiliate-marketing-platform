"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import ReactCountryFlag from "react-country-flag";
import { X, Plus, Search, Clock } from "lucide-react";
import { TARGET_COUNTRIES, localClock, isOperable, OP_LABEL, type TargetCountry } from "@/lib/target-countries";

type Geometry = { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
type Feature = { id: string; properties: { name: string }; geometry: Geometry };
type FC = { features: Feature[] };

/* Ventana de proyección: Norteamérica + Europa (plate carrée). */
const LON0 = -130, LON1 = 32, LAT0 = 23, LAT1 = 72;
const VW = 960;
const VH = Math.round((VW * (LAT1 - LAT0)) / (LON1 - LON0)); // ≈ 290

function project(lon: number, lat: number): [number, number] {
  return [((lon - LON0) / (LON1 - LON0)) * VW, ((LAT1 - lat) / (LAT1 - LAT0)) * VH];
}
function ringPath(ring: number[][]): string {
  // Descartar anillos que cruzan el antimeridiano (evita rayas horizontales: Alaska/Rusia).
  let minLon = Infinity, maxLon = -Infinity;
  for (const p of ring) { const lon = p[0]!; if (lon < minLon) minLon = lon; if (lon > maxLon) maxLon = lon; }
  if (maxLon - minLon > 200) return "";
  let d = "";
  for (let i = 0; i < ring.length; i++) {
    const [x, y] = project(ring[i]![0]!, ring[i]![1]!);
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
  }
  return d + "Z";
}
function geomPath(g: Geometry): string {
  if (g.type === "Polygon") return (g.coordinates as number[][][]).map(ringPath).join("");
  return (g.coordinates as number[][][][]).flatMap((p) => p.map(ringPath)).join("");
}

const TARGET_BY_ID = new Map(TARGET_COUNTRIES.map((c) => [c.id, c]));

export function OpsMap() {
  const [fc, setFc] = useState<FC | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState<TargetCountry | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/world-geo.json").then((r) => r.json()).then((d: FC) => { if (alive) setFc(d); }).catch(() => {});
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  // Estado operable por país (recalcula cada tick).
  const rows = useMemo(() => {
    return TARGET_COUNTRIES.map((c) => {
      const { minutes, label } = localClock(c.timezone, now);
      return { c, label, open: isOperable(minutes) };
    }).sort((a, b) => (a.open === b.open ? a.c.name.localeCompare(b.c.name) : a.open ? -1 : 1));
  }, [now]);
  const openById = useMemo(() => new Map(rows.map((r) => [r.c.id, r.open])), [rows]);
  const openCount = rows.filter((r) => r.open).length;

  // Paths precomputados (no cambian con el reloj).
  const paths = useMemo(() => fc?.features.map((f) => ({ id: f.id, d: geomPath(f.geometry) })) ?? [], [fc]);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Mapa ── */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Mapa de operaciones</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-success)" }} />
            {openCount} operando
          </span>
          <span className="ml-auto hidden text-[11px] sm:inline" style={{ color: "var(--color-subtle)" }}>Horario local {OP_LABEL}</span>
        </header>

        <div className="flex flex-1 items-center justify-center p-4 md:p-8">
          <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ maxHeight: "72vh" }} role="img" aria-label="Mapa de países objetivo">
            {paths.map((p) => {
              const target = TARGET_BY_ID.get(p.id);
              const open = target ? openById.get(p.id) : false;
              const fill = !target ? "var(--color-surface)" : open ? "var(--color-success)" : "var(--color-surface-overlay)";
              const stroke = !target ? "var(--color-border)" : open ? "rgba(255,255,255,0.45)" : "var(--color-subtle)";
              return (
                <path key={p.id} d={p.d}
                  className={open ? "ops-open" : undefined}
                  onClick={target && open ? () => setSelected(target) : undefined}
                  style={{
                    fill, stroke, strokeWidth: 0.5,
                    fillOpacity: !target ? 1 : open ? 0.9 : 0.85,
                    cursor: target && open ? "pointer" : "default",
                    transition: "fill .3s ease, fill-opacity .3s ease",
                  }}>
                  <title>{target ? `${target.name}${open ? " · operando" : " · cerrado"}` : p.id}</title>
                </path>
              );
            })}
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
