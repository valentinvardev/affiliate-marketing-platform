"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, Monitor, Smartphone, Copy, Check, ExternalLink, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import type { Offer, OffersResponse } from "@/lib/taprain";

const TYPE_OPTIONS = [
  { value: "",          label: "Todos los tipos" },
  { value: "cpi",       label: "CPI" },
  { value: "cpe",       label: "CPE" },
  { value: "soi",       label: "SOI" },
  { value: "rev-share", label: "RevShare" },
];

const DEVICE_OPTIONS = [
  { value: "",        label: "Todos los dispositivos" },
  { value: "android", label: "Android" },
  { value: "ios",     label: "iOS" },
  { value: "desktop", label: "Desktop" },
];

function DeviceIcon({ d }: { d: string }) {
  return d === "desktop"
    ? <Monitor className="h-3 w-3" />
    : <Smartphone className="h-3 w-3" />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors"
      style={{
        background: copied ? "rgba(167,139,250,0.15)" : "var(--color-surface-overlay)",
        border: "1px solid var(--color-border)",
        color: copied ? "#a78bfa" : "var(--color-muted-foreground)",
      }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copiado" : "Copiar link"}
    </button>
  );
}

function SimpleSelect({
  value, onChange, options, fullWidth, dropUp,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  fullWidth?: boolean;
  dropUp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0]!;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} className={fullWidth ? "relative w-full" : "relative"}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
        style={{
          background: value ? "rgba(167,139,250,0.1)" : "var(--color-surface-overlay)",
          border: `1px solid ${value ? "rgba(167,139,250,0.25)" : "var(--color-border)"}`,
          color: value ? "#a78bfa" : "var(--color-muted-foreground)",
          minWidth: fullWidth ? undefined : 140,
          width: fullWidth ? "100%" : undefined,
        }}
      >
        <span className="flex-1 text-left">{current.label}</span>
        <ChevronDown className="h-3 w-3 shrink-0" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div
          className={`absolute left-0 z-30 overflow-hidden rounded-lg py-1 ${dropUp ? "bottom-full mb-1" : "top-full mt-1"}`}
          style={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            minWidth: "100%",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs"
              style={{ color: value === opt.value ? "#a78bfa" : "var(--color-muted-foreground)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {value === opt.value && <Check className="h-3 w-3 shrink-0" />}
              {value !== opt.value && <span className="w-3 shrink-0" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OffersPage() {
  const [offers, setOffers]   = useState<Offer[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [search, setSearch]   = useState("");
  const [type, setType]       = useState("");
  const [device, setDevice]   = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeFilters = (type ? 1 : 0) + (device ? 1 : 0);

  const load = useCallback(async (q: string, tp: string, dv: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (q)  params.set("search",  q);
      if (tp) params.set("type",    tp);
      if (dv) params.set("devices", dv);
      const res = await fetch(`/api/taprain/offers?${params}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as OffersResponse;
      setOffers(data.offers);
      setTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando offers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load("", "", ""); }, [load]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void load(search, type, device), 400);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [search, type, device, load]);

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-8"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Offers</h1>
        {!loading && (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] tabular-nums"
            style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}
          >
            {total}
          </span>
        )}
      </header>

      <div
        className="flex shrink-0 items-center gap-2 px-4 py-3 md:gap-3 md:px-8"
        style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}
      >
        <div
          className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}
        >
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
          <input
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--color-foreground)" }}
          />
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" style={{ color: "var(--color-subtle)" }} />}
        </div>

        {/* Filtros inline (desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <SimpleSelect value={type}   onChange={setType}   options={TYPE_OPTIONS} />
          <SimpleSelect value={device} onChange={setDevice} options={DEVICE_OPTIONS} />
        </div>

        {/* Botón filtros (móvil) */}
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs md:hidden"
          style={{
            background: activeFilters ? "rgba(167,139,250,0.1)" : "var(--color-surface-overlay)",
            border: `1px solid ${activeFilters ? "rgba(167,139,250,0.25)" : "var(--color-border)"}`,
            color: activeFilters ? "#a78bfa" : "var(--color-muted-foreground)",
          }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
          {activeFilters > 0 && (
            <span
              className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
              style={{ background: "#a78bfa", color: "#000" }}
            >
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Modal de filtros (móvil) */}
      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center md:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl p-5"
            style={{ background: "var(--color-surface-raised)", borderTop: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Filtros</p>
              <button type="button" onClick={() => setFiltersOpen(false)} style={{ color: "var(--color-subtle)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Tipo</label>
                <SimpleSelect value={type} onChange={setType} options={TYPE_OPTIONS} fullWidth dropUp />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Dispositivo</label>
                <SimpleSelect value={device} onChange={setDevice} options={DEVICE_OPTIONS} fullWidth dropUp />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              {activeFilters > 0 && (
                <button
                  type="button"
                  onClick={() => { setType(""); setDevice(""); }}
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                  style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}
                >
                  Limpiar
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 px-4 py-6 md:px-8">
        {error && (
          <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>
        )}

        {!error && !loading && offers.length === 0 && (
          <p className="text-sm" style={{ color: "var(--color-subtle)" }}>Sin resultados.</p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="flex flex-col gap-3 rounded-xl p-4"
              style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}
            >
              {/* Top row */}
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                  style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}
                >
                  {offer.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={offer.image_url} alt={offer.name} className="h-full w-full object-cover" />
                    : <span className="text-lg">📦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                    {offer.name}
                  </p>
                  {offer.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      {offer.description}
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-base font-bold tabular-nums" style={{ color: "#a78bfa" }}>
                  {offer.payout != null ? `$${offer.payout.toFixed(2)}` : "Rev%"}
                </p>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                {/* Type badge */}
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                  style={{ background: "var(--color-surface-overlay)", color: "var(--color-subtle)", border: "1px solid var(--color-border)" }}
                >
                  {offer.payout_type}
                </span>

                {/* Countries */}
                <div className="flex items-center gap-0.5">
                  {offer.countries.slice(0, 5).map((cc) => (
                    <ReactCountryFlag key={cc} countryCode={cc} svg style={{ width: "1.1em", height: "0.85em", borderRadius: 2 }} />
                  ))}
                  {offer.countries.length > 5 && (
                    <span className="text-[10px]" style={{ color: "var(--color-subtle)" }}>+{offer.countries.length - 5}</span>
                  )}
                </div>

                {/* Devices */}
                <div className="flex items-center gap-1" style={{ color: "var(--color-subtle)" }}>
                  {offer.devices.map((d) => <DeviceIcon key={d} d={d} />)}
                </div>

                {/* Cap */}
                {offer.daily_cap != null && (
                  <span className="text-[10px]" style={{ color: "var(--color-subtle)" }}>
                    cap {offer.daily_cap}/d
                  </span>
                )}
              </div>

              {/* Conversion goal */}
              {offer.conversion && (
                <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
                  ↳ {offer.conversion}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <CopyButton text={offer.tracking_url} />
                <a
                  href={offer.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px]"
                  style={{ color: "var(--color-subtle)", border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}
                >
                  <ExternalLink className="h-3 w-3" />
                  Abrir
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
