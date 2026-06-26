"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, ExternalLink, Check, Loader2, ChevronDown, Monitor, Smartphone, Tablet, AlertTriangle, ArrowLeft } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import type { Offer, OffersResponse } from "@/lib/taprain";

/* ─── Types ─── */
type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, s1: string) => void;
  defaultS1?: string;
};

const DOMAINS = ["taprkr.com", "raintrkr.com"] as const;
const DEVICE_FILTERS = [
  { value: "", label: "Todos" },
  { value: "android", label: "Android" },
  { value: "ios", label: "iOS" },
  { value: "desktop", label: "Desktop" },
] as const;
const TYPE_FILTERS = [
  { value: "", label: "Todos" },
  { value: "cpi", label: "CPI" },
  { value: "cpe", label: "CPE" },
  { value: "soi", label: "SOI" },
  { value: "rev-share", label: "RevShare" },
] as const;

/* ─── Device icon ─── */
function DeviceIcon({ device }: { device: string }) {
  if (device === "ios" || device === "android") return <Smartphone className="h-3 w-3" />;
  if (device === "desktop") return <Monitor className="h-3 w-3" />;
  return <Tablet className="h-3 w-3" />;
}

/* ─── Build tracking URL ─── */
function buildUrl(baseUrl: string, domain: string, s1: string, s2: string): string {
  try {
    const url = new URL(baseUrl);
    // Swap domain if requested
    if (domain && !url.hostname.includes(domain)) {
      url.hostname = domain;
    }
    if (s1.trim()) url.searchParams.set("s1", s1.trim());
    else url.searchParams.delete("s1");
    if (s2.trim()) url.searchParams.set("s2", s2.trim());
    else url.searchParams.delete("s2");
    return url.toString();
  } catch {
    return baseUrl;
  }
}

/* ─── Main modal ─── */
export function OfferPickerModal({ open, onClose, onSelect, defaultS1 = "" }: Props) {
  const [offers, setOffers]         = useState<Offer[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [device, setDevice]         = useState("");
  const [type, setType]             = useState("");
  const [selected, setSelected]     = useState<Offer | null>(null);
  const [s1, setS1]                 = useState(defaultS1);
  const [s2, setS2]                 = useState("");
  const [domain, setDomain]         = useState<string>(DOMAINS[0]);
  const [mounted, setMounted]       = useState(false);
  const [show, setShow]             = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fade in/out (montar → fade in; cerrar → fade out → desmontar)
  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(id);
    }
    setShow(false);
    const t = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(t);
  }, [open]);

  const load = useCallback(async (q: string, dev: string, tp: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (q)   params.set("search",  q);
      if (dev) params.set("devices", dev);
      if (tp)  params.set("type",    tp);
      const res = await fetch(`/api/taprain/offers?${params}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = (await res.json()) as OffersResponse;
      setOffers(data.offers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on open
  useEffect(() => {
    if (open) {
      setSelected(null);
      setShowDetail(false);
      setS1(defaultS1);
      setS2("");
      void load("", "", "");
    }
  }, [open, defaultS1, load]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => void load(search, device, type), 400);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [search, device, type, open, load]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const finalUrl = selected ? buildUrl(selected.tracking_url ?? "", domain, s1, s2) : "";
  const hasTracking = !!finalUrl;

  function selectOffer(offer: Offer) {
    setSelected(offer);
    setShowDetail(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(4px)",
        opacity: show ? 1 : 0,
        transition: "opacity 0.2s ease",
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl sm:h-auto"
        style={{
          background: "var(--color-surface-raised)",
          border: "1px solid var(--color-border)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
          maxHeight: "88vh",
          opacity: show ? 1 : 0,
          transform: show ? "scale(1)" : "scale(0.97)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
              Buscar oferta
            </p>
            <p className="text-xs" style={{ color: "var(--color-subtle)" }}>
              TapRain · {offers.length} disponibles
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ color: "var(--color-subtle)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filters */}
        <div
          className="flex shrink-0 items-center gap-2 px-5 py-3"
          style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}
        >
          <div
            className="flex flex-1 items-center gap-2 rounded-lg px-3 py-1.5"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}
          >
            <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
            <input
              autoFocus
              placeholder="Buscar oferta…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--color-foreground)" }}
            />
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" style={{ color: "var(--color-subtle)" }} />}
          </div>

          <FilterChips value={device} onChange={setDevice} options={DEVICE_FILTERS} />
          <FilterChips value={type}   onChange={setType}   options={TYPE_FILTERS} />
        </div>

        <div className="relative flex flex-1 overflow-hidden">
          {/* Offer list */}
          <div
            className="h-full w-full overflow-y-auto sm:w-auto sm:flex-1"
            style={{ borderRight: selected ? "1px solid var(--color-border)" : "none" }}
          >
            {error && (
              <p className="p-5 text-sm" style={{ color: "var(--color-error)" }}>{error}</p>
            )}
            {!error && offers.length === 0 && !loading && (
              <p className="p-5 text-sm" style={{ color: "var(--color-subtle)" }}>
                Sin resultados
              </p>
            )}
            {offers.map((offer) => (
              <button
                key={offer.id}
                type="button"
                onClick={() => selectOffer(offer)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors"
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  background: selected?.id === offer.id ? "rgba(167,139,250,0.08)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (selected?.id !== offer.id)
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  if (selected?.id !== offer.id)
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {/* Image */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                  style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}
                >
                  {offer.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={offer.image_url} alt={offer.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg">📦</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                      {offer.name}
                    </p>
                    <span
                      className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ background: "var(--color-surface-overlay)", color: "var(--color-subtle)" }}
                    >
                      {offer.payout_type}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    {/* Countries (max 4 flags) */}
                    <div className="flex gap-0.5">
                      {offer.countries.slice(0, 4).map((cc) => (
                        <ReactCountryFlag
                          key={cc}
                          countryCode={cc}
                          svg
                          style={{ width: "1.1em", height: "0.85em", borderRadius: 2 }}
                        />
                      ))}
                      {offer.countries.length > 4 && (
                        <span className="text-[10px]" style={{ color: "var(--color-subtle)" }}>
                          +{offer.countries.length - 4}
                        </span>
                      )}
                    </div>
                    {/* Devices */}
                    <div className="flex gap-1" style={{ color: "var(--color-subtle)" }}>
                      {offer.devices.map((d) => <DeviceIcon key={d} device={d} />)}
                    </div>
                    {offer.daily_cap != null && (
                      <span className="text-[10px]" style={{ color: "var(--color-subtle)" }}>
                        cap {offer.daily_cap}/día
                      </span>
                    )}
                  </div>
                </div>

                {/* Payout */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums" style={{ color: "#a78bfa" }}>
                    {offer.payout != null ? `$${offer.payout.toFixed(2)}` : "RevShare"}
                  </p>
                  {selected?.id === offer.id && (
                    <Check className="ml-auto mt-0.5 h-3.5 w-3.5" style={{ color: "#a78bfa" }} />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Config panel — overlay deslizante en móvil, split en desktop */}
          {selected && (
            <div
              className={`absolute inset-0 z-10 flex flex-col gap-4 overflow-y-auto p-5 transition-transform duration-300 sm:static sm:z-auto sm:w-72 sm:shrink-0 sm:translate-x-0 ${showDetail ? "translate-x-0" : "translate-x-full"}`}
              style={{ background: "var(--color-surface-raised)" }}
            >
              {/* Volver (solo móvil) */}
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="-mx-1 -mt-1 flex items-center gap-1.5 self-start rounded-md px-1 py-1 text-xs font-medium sm:hidden"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a ofertas
              </button>

              {/* Selected offer summary */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
                  Oferta seleccionada
                </p>
                <p className="mt-1.5 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                  {selected.name}
                </p>
                <p className="text-sm font-semibold" style={{ color: "#a78bfa" }}>
                  {selected.payout != null ? `$${selected.payout.toFixed(2)}` : "RevShare"}
                </p>
                {selected.conversion && (
                  <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                    {selected.conversion}
                  </p>
                )}
              </div>

              {!hasTracking ? (
                /* ── No tracking URL — show alert only ── */
                <div
                  className="flex flex-col items-center gap-3 rounded-xl px-4 py-6 text-center"
                  style={{
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <AlertTriangle className="h-8 w-8" style={{ color: "var(--color-error)" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                      Oferta no habilitada
                    </p>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
                      Esta oferta no tiene URL de tracking disponible en tu cuenta. Contactá a TapRain para activarla.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* SubID config */}
                  <div className="space-y-3">
                    <ConfigField label="s1 — Campaña" hint="Identifica desde qué campaña viene el tráfico">
                      <input
                        value={s1}
                        onChange={(e) => setS1(e.target.value)}
                        placeholder="ej: my-campaign-slug"
                        className="w-full rounded-md px-3 py-1.5 text-xs outline-none"
                        style={{
                          background: "var(--color-surface-overlay)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-foreground)",
                        }}
                      />
                    </ConfigField>

                    <ConfigField label="s2 — Opcional">
                      <input
                        value={s2}
                        onChange={(e) => setS2(e.target.value)}
                        placeholder="placement, variante…"
                        className="w-full rounded-md px-3 py-1.5 text-xs outline-none"
                        style={{
                          background: "var(--color-surface-overlay)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-foreground)",
                        }}
                      />
                    </ConfigField>

                    <ConfigField label="Dominio de tracking">
                      <div className="flex gap-1.5">
                        {DOMAINS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDomain(d)}
                            className="flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors"
                            style={{
                              background: domain === d ? "var(--color-foreground)" : "var(--color-surface-overlay)",
                              color:      domain === d ? "var(--color-background)" : "var(--color-muted-foreground)",
                              border:     domain === d ? "none" : "1px solid var(--color-border)",
                            }}
                          >
                            {d.split(".")[0]}
                          </button>
                        ))}
                      </div>
                    </ConfigField>
                  </div>

                  {/* URL preview */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
                      URL generada
                    </p>
                    <div
                      className="break-all rounded-md p-3 font-mono text-[10px]"
                      style={{
                        background: "var(--color-surface-overlay)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-muted-foreground)",
                      }}
                    >
                      {finalUrl}
                    </div>
                    <a
                      href={finalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 flex items-center gap-1 text-[11px]"
                      style={{ color: "var(--color-subtle)" }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Probar link
                    </a>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="mt-auto flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="hidden flex-1 rounded-md py-2 text-xs sm:block"
                  style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(finalUrl, s1.trim())}
                  disabled={!hasTracking}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold"
                  style={{
                    background: hasTracking ? "var(--color-foreground)" : "var(--color-surface-overlay)",
                    color: hasTracking ? "var(--color-background)" : "var(--color-subtle)",
                    cursor: hasTracking ? "pointer" : "not-allowed",
                    border: hasTracking ? "none" : "1px solid var(--color-border)",
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                  Usar este link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Filter chips ─── */
function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0]!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs"
        style={{
          background: value ? "rgba(167,139,250,0.15)" : "var(--color-surface-overlay)",
          border: `1px solid ${value ? "rgba(167,139,250,0.3)" : "var(--color-border)"}`,
          color: value ? "#a78bfa" : "var(--color-muted-foreground)",
        }}
      >
        {current.label}
        <ChevronDown className="h-3 w-3" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-10 mt-1 min-w-full overflow-hidden rounded-lg py-1"
          style={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs"
              style={{ color: value === opt.value ? "#a78bfa" : "var(--color-muted-foreground)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {value === opt.value && <Check className="h-3 w-3" />}
              {value !== opt.value && <span className="w-3" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Config field wrapper ─── */
function ConfigField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
        {label}
      </p>
      {children}
      {hint && <p className="mt-1 text-[10px]" style={{ color: "var(--color-subtle)" }}>{hint}</p>}
    </div>
  );
}
