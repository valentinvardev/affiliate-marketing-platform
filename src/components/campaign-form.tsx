"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/trpc/react";
import { CURRENCIES } from "@/lib/currencies";
import { LOCALES } from "@/lib/locales";
import { slugify } from "@/lib/utils";
import {
  Loader2, Upload, Copy, Check, X,
  ExternalLink, Smartphone, ChevronLeft, ChevronDown,
} from "lucide-react";

/* ─── Color presets ─── */
const COLOR_PRESETS = [
  { label: "Dorado",  primary: "oklch(0.74 0.19 55)",  bg: "oklch(0.16 0.04 265)" },
  { label: "Verde",   primary: "oklch(0.72 0.19 145)", bg: "oklch(0.15 0.04 165)" },
  { label: "Azul",    primary: "oklch(0.65 0.22 255)", bg: "oklch(0.14 0.05 255)" },
  { label: "Naranja", primary: "oklch(0.68 0.22 35)",  bg: "oklch(0.15 0.04 20)"  },
  { label: "Morado",  primary: "oklch(0.65 0.22 295)", bg: "oklch(0.14 0.05 280)" },
  { label: "Rosa",    primary: "oklch(0.72 0.18 350)", bg: "oklch(0.15 0.04 330)" },
];

/* ─── Types ─── */
type UrlStatus = "idle" | "checking" | "valid" | "invalid";

type FormValues = {
  name: string; slug: string; templateSlug: string;
  locale: string; currencyCode: string; currencySymbol: string;
  ctaUrl: string; logoUrl: string;
  colorPrimary: string; colorBg: string; isActive: boolean;
};

type Campaign = {
  id: string; name: string; slug: string; templateSlug: string;
  locale: string; currencyCode: string; currencySymbol: string;
  ctaUrl: string; logoUrl: string | null;
  colorPrimary: string; colorBg: string; isActive: boolean;
};

/* ─── URL validator hook ─── */
function useUrlStatus(url: string): UrlStatus {
  const [status, setStatus] = useState<UrlStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!url.trim()) { setStatus("idle"); return; }
    setStatus("checking");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        const u = new URL(url);
        setStatus(u.protocol === "https:" || u.protocol === "http:" ? "valid" : "invalid");
      } catch {
        setStatus("invalid");
      }
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [url]);

  return status;
}

/* ─── Base input ─── */
function Input({
  suffix,
  className = "",
  style: extraStyle,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { suffix?: React.ReactNode }) {
  const [focused, setFocused] = useState(false);

  if (suffix) {
    return (
      <div
        className="flex items-center rounded-md overflow-hidden transition-colors"
        style={{
          border: `1px solid ${focused ? "var(--color-border-focus)" : "var(--color-border)"}`,
          background: "var(--color-surface-overlay)",
        }}
      >
        <input
          {...props}
          className={`flex-1 bg-transparent px-3 py-2 text-sm outline-none ${className}`}
          style={{ color: "var(--color-foreground)", ...extraStyle }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
        />
        <div className="flex shrink-0 items-center pr-2.5">{suffix}</div>
      </div>
    );
  }

  return (
    <input
      {...props}
      className={`w-full rounded-md px-3 py-2 text-sm outline-none transition-colors ${className}`}
      style={{
        background: "var(--color-surface-overlay)",
        border: `1px solid ${focused ? "var(--color-border-focus)" : "var(--color-border)"}`,
        color: "var(--color-foreground)",
        ...extraStyle,
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

/* ─── Dropdown ─── */
function Dropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; prefix?: string; meta?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onMouse(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onMouse);
    return () => document.removeEventListener("mousedown", onMouse);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Scroll selected item into view when panel opens
  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.querySelector("[data-selected]") as HTMLElement | null;
    active?.scrollIntoView({ block: "nearest" });
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors"
        style={{
          background: "var(--color-surface-overlay)",
          border: `1px solid ${open ? "var(--color-border-focus)" : "var(--color-border)"}`,
          color: "var(--color-foreground)",
        }}
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.prefix && <span className="shrink-0 text-base leading-none">{selected.prefix}</span>}
          <span className="truncate">{selected?.label ?? "Seleccionar…"}</span>
          {selected?.meta && (
            <span className="shrink-0 text-xs" style={{ color: "var(--color-subtle)" }}>{selected.meta}</span>
          )}
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 transition-transform duration-150"
          style={{
            color: "var(--color-subtle)",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg"
          style={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          }}
        >
          <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-selected={isSelected ? true : undefined}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors"
                  style={{
                    background: isSelected ? "rgba(255,255,255,0.06)" : "transparent",
                    color: isSelected ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isSelected ? "rgba(255,255,255,0.06)" : "transparent";
                    (e.currentTarget as HTMLElement).style.color = isSelected ? "var(--color-foreground)" : "var(--color-muted-foreground)";
                  }}
                >
                  {opt.prefix && (
                    <span className="shrink-0 text-base leading-none">{opt.prefix}</span>
                  )}
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.meta && (
                    <span className="shrink-0 text-[11px]" style={{ color: "var(--color-subtle)" }}>{opt.meta}</span>
                  )}
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-success)" }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Field ─── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>{hint}</p>}
    </div>
  );
}

/* ─── Section ─── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "var(--color-border)" }} />;
}

/* ─── URL status indicator ─── */
function UrlIndicator({ status }: { status: UrlStatus }) {
  if (status === "idle")     return null;
  if (status === "checking") return <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-subtle)" }} />;
  if (status === "valid")    return <Check className="h-4 w-4" style={{ color: "var(--color-success)" }} />;
  return <X className="h-4 w-4" style={{ color: "var(--color-error)" }} />;
}

/* ─── Preview modal ─── */
function PreviewModal({
  open,
  onClose,
  colorPrimary,
  colorBg,
  logoUrl,
  currencySymbol,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  colorPrimary: string;
  colorBg: string;
  logoUrl: string;
  currencySymbol: string;
  locale: string;
}) {
  const loc = LOCALES.find((l) => l.code === locale);
  const flag = loc?.flag ?? "🌐";

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      {/* Phone frame */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: 390,
          height: 720,
          maxHeight: "90vh",
          borderRadius: 44,
          border: "10px solid #1a1a1a",
          boxShadow: "0 0 0 2px #333, 0 40px 80px rgba(0,0,0,0.8)",
          background: colorBg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
          style={{ width: 120, height: 28, background: "#1a1a1a", borderRadius: "0 0 20px 20px" }}
        />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80"
          style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div style={{ position: "absolute", top: -40, left: -40, width: 220, height: 220, background: `radial-gradient(circle, ${colorPrimary}55 0%, transparent 70%)` }} />
          <div style={{ position: "absolute", top: "30%", right: -60, width: 220, height: 220, background: "radial-gradient(circle, oklch(0.55 0.18 280 / 0.3) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: "20%", width: 200, height: 200, background: `radial-gradient(circle, ${colorPrimary}33 0%, transparent 70%)` }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 overflow-y-auto" style={{ paddingTop: 36, scrollbarWidth: "none" }}>
          {/* Hero */}
          <div className="flex flex-col items-center px-5 pt-8 pb-4 text-center">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="h-14 w-14 rounded-xl object-contain mb-3" />
            ) : (
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {flag}
              </div>
            )}

            <h1 className="text-3xl font-black leading-tight text-white">
              Earn money by playing{" "}
              <span style={{ color: colorPrimary }}>games</span>
            </h1>
            <p className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              Play your favourite games to earn money
            </p>

            {/* CTA Button */}
            <div className="relative mt-5 w-full">
              <span className="absolute inset-0 translate-y-1 rounded-full bg-green-700" />
              <div className="relative flex items-center justify-center gap-3 rounded-full border-t border-white/30 bg-gradient-to-b from-green-400 to-green-500 px-8 py-3.5 shadow-xl">
                <span className="text-base font-black uppercase tracking-tight text-white">Download now</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px]" style={{ color: "rgba(255,255,255,0.55)" }}>
              {["Free", "Instant cash out", "Unlimited offers"].map((b) => (
                <span key={b} className="inline-flex items-center gap-1">
                  <span style={{ color: colorPrimary }}>✓</span> {b}
                </span>
              ))}
            </div>
          </div>

          {/* Popular offers grid */}
          <div className="px-4 pb-4">
            <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
              Popular offers
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { name: "Block Blast", amount: 12, badge: "TOP" },
                { name: "Clash Royale", amount: 15, badge: "HOT" },
                { name: "Candy Crush", amount: 35, badge: "TOP" },
                { name: "Subway Surfers", amount: 12, badge: "HOT" },
              ].map((o) => (
                <div
                  key={o.name}
                  className="overflow-hidden rounded-xl"
                  style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="relative aspect-square" style={{ background: `linear-gradient(135deg, ${colorPrimary}22, rgba(255,255,255,0.04))` }}>
                    <span className="absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-black text-white"
                      style={{ background: colorPrimary }}>
                      {o.badge}
                    </span>
                    <div className="flex h-full items-center justify-center text-3xl">🎮</div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[13px] font-extrabold text-white">{o.name}</p>
                    <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>Per hour played</p>
                    <p className="mt-1 text-lg font-black" style={{ color: colorPrimary }}>
                      {currencySymbol}{o.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky CTA */}
        <div className="relative z-10 p-3 pt-0">
          <div className="relative">
            <span className="absolute inset-0 translate-y-1 rounded-full bg-green-700" />
            <div className="relative flex items-center justify-between rounded-full border-t border-white/30 bg-gradient-to-b from-green-400 to-green-500 p-3 pl-4">
              <div>
                <p className="text-sm font-extrabold text-white">Download the app now</p>
                <p className="text-[10px] text-green-50/80">Free · Instant cash out</p>
              </div>
              <span className="rounded-full bg-green-400/40 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white">
                FREE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <p className="absolute bottom-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
        Esc o clic fuera para cerrar
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN FORM
═══════════════════════════════════════════════ */
export function CampaignForm({ campaign }: { campaign?: Campaign }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slugCopied, setSlugCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [values, setValues] = useState<FormValues>({
    name:          campaign?.name          ?? "",
    slug:          campaign?.slug          ?? "",
    templateSlug:  campaign?.templateSlug  ?? "gonza-gb-sn-fc",
    locale:        campaign?.locale        ?? "en",
    currencyCode:  campaign?.currencyCode  ?? "GBP",
    currencySymbol:campaign?.currencySymbol?? "£",
    ctaUrl:        campaign?.ctaUrl        ?? "",
    logoUrl:       campaign?.logoUrl       ?? "",
    colorPrimary:  campaign?.colorPrimary  ?? "oklch(0.74 0.19 55)",
    colorBg:       campaign?.colorBg       ?? "oklch(0.16 0.04 265)",
    isActive:      campaign?.isActive      ?? true,
  });

  const ctaStatus = useUrlStatus(values.ctaUrl);

  const create = api.campaign.create.useMutation({ onSuccess: (c) => router.push(`/campaigns/${c.id}`) });
  const update = api.campaign.update.useMutation({ onSuccess: () => router.refresh() });

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((p) => ({ ...p, [key]: val }));
  }

  function handleNameChange(name: string) {
    set("name", name);
    if (!campaign) set("slug", slugify(name));
  }

  function handleLocaleChange(locale: string) {
    set("locale", locale);
    const loc = LOCALES.find((l) => l.code === locale);
    if (loc) {
      const cur = CURRENCIES.find((c) => c.code === loc.defaultCurrencyCode);
      if (cur) { set("currencyCode", cur.code); set("currencySymbol", cur.symbol); }
    }
  }

  function handleCurrencyChange(code: string) {
    const cur = CURRENCIES.find((c) => c.code === code);
    if (cur) { set("currencyCode", cur.code); set("currencySymbol", cur.symbol); }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = (await res.json()) as { url?: string };
    if (data.url) set("logoUrl", data.url);
    setUploading(false);
  }

  function copySlugUrl() {
    const slug = values.slug || campaign?.slug;
    if (!slug) return;
    void navigator.clipboard.writeText(`${window.location.origin}/api/config/${slug}`);
    setSlugCopied(true);
    setTimeout(() => setSlugCopied(false), 2000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      const payload = { ...values, logoUrl: values.logoUrl || null };
      if (campaign) update.mutate({ id: campaign.id, ...payload });
      else create.mutate(payload);
    });
  }

  const isSaving = pending || create.isPending || update.isPending;
  const error = create.error?.message ?? update.error?.message;

  return (
    <>
      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        colorPrimary={values.colorPrimary}
        colorBg={values.colorBg}
        logoUrl={values.logoUrl}
        currencySymbol={values.currencySymbol}
        locale={values.locale}
      />

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Identidad + Mercado (same aligned 2-col grid) ── */}
        <Section title="Campaña">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            {/* Row 1: Nombre | Slug */}
            <Field label="Nombre">
              <Input
                placeholder="UK Marzo 2025"
                value={values.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </Field>

            <Field label="Slug (ID público)" hint="Usado como ?c=slug en la plantilla">
              <Input
                placeholder="uk-marzo-2025"
                value={values.slug}
                onChange={(e) => set("slug", e.target.value)}
                required
                suffix={
                  values.slug ? (
                    <button type="button" onClick={copySlugUrl} title="Copiar URL de config">
                      {slugCopied
                        ? <Check className="h-3.5 w-3.5" style={{ color: "var(--color-success)" }} />
                        : <Copy className="h-3.5 w-3.5" style={{ color: "var(--color-subtle)" }} />}
                    </button>
                  ) : null
                }
              />
            </Field>

            {/* Row 2: Idioma | Moneda */}
            <Field label="Idioma / País">
              <Dropdown
                value={values.locale}
                onChange={handleLocaleChange}
                options={LOCALES.map((l) => ({ value: l.code, label: l.label, prefix: l.flag }))}
              />
            </Field>

            <Field label="Moneda" hint={`Símbolo: ${values.currencySymbol}`}>
              <Dropdown
                value={values.currencyCode}
                onChange={handleCurrencyChange}
                options={CURRENCIES.map((c) => ({ value: c.code, label: c.label, meta: c.symbol }))}
              />
            </Field>
          </div>
        </Section>

        <Divider />

        {/* ── CTA ── */}
        <Section title="CTA">
          <Field label="URL de afiliado">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="https://taprkr.com/r/..."
                  value={values.ctaUrl}
                  onChange={(e) => set("ctaUrl", e.target.value)}
                  required
                  suffix={<UrlIndicator status={ctaStatus} />}
                />
              </div>
              {ctaStatus === "valid" && (
                <a
                  href={values.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors"
                  style={{
                    background: "var(--color-surface-overlay)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </Field>
        </Section>

        <Divider />

        {/* ── Logo ── */}
        <Section title="Logo">
          <div className="flex items-center gap-4">
            {values.logoUrl ? (
              <div className="relative shrink-0">
                <Image
                  src={values.logoUrl}
                  alt="Logo"
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-xl object-contain"
                  style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}
                />
                <button
                  type="button"
                  onClick={() => set("logoUrl", "")}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                style={{ border: "1px dashed var(--color-border)", background: "var(--color-surface-overlay)" }}
              >
                <span className="text-2xl">🖼</span>
              </div>
            )}

            <label
              className="inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
              style={{
                background: "var(--color-surface-overlay)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
              }}
            >
              <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
              {uploading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo…</>
                : <><Upload className="h-4 w-4" /> Subir logo</>}
            </label>
          </div>
        </Section>

        <Divider />

        {/* ── Colores ── */}
        <Section title="Colores">
          {/* Presets */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {COLOR_PRESETS.map((p) => {
              const active = values.colorPrimary === p.primary;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { set("colorPrimary", p.primary); set("colorBg", p.bg); }}
                  className="group relative flex flex-col items-center gap-1.5 rounded-lg p-2 text-[11px] transition-colors"
                  style={{
                    border: `1px solid ${active ? "var(--color-border-focus)" : "var(--color-border)"}`,
                    background: active ? "var(--color-surface-overlay)" : "transparent",
                    color: active ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                  }}
                >
                  {/* Mini preview pill */}
                  <span
                    className="h-7 w-full rounded-md"
                    style={{ background: p.bg, border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <span
                      className="block mx-auto mt-1 h-2 w-1/2 rounded-full"
                      style={{ background: p.primary }}
                    />
                  </span>
                  {p.label}
                  {active && (
                    <Check className="absolute right-1.5 top-1.5 h-3 w-3" style={{ color: "var(--color-success)" }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom inputs */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Color principal">
              <div className="flex gap-2">
                <input
                  type="color"
                  className="h-9 w-10 cursor-pointer rounded-md p-0.5"
                  style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}
                  value={toHex(values.colorPrimary)}
                  onChange={(e) => set("colorPrimary", e.target.value)}
                />
                <Input
                  value={values.colorPrimary}
                  onChange={(e) => set("colorPrimary", e.target.value)}
                  placeholder="oklch(0.74 0.19 55)"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}
                />
              </div>
            </Field>

            <Field label="Color de fondo">
              <div className="flex gap-2">
                <input
                  type="color"
                  className="h-9 w-10 cursor-pointer rounded-md p-0.5"
                  style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}
                  value={toHex(values.colorBg)}
                  onChange={(e) => set("colorBg", e.target.value)}
                />
                <Input
                  value={values.colorBg}
                  onChange={(e) => set("colorBg", e.target.value)}
                  placeholder="oklch(0.16 0.04 265)"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}
                />
              </div>
            </Field>
          </div>

          {/* Preview button */}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              background: "var(--color-surface-overlay)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground)",
            }}
          >
            <Smartphone className="h-4 w-4" />
            Ver preview en mobile
          </button>
        </Section>

        <Divider />

        {/* ── Estado ── */}
        <Section title="Estado">
          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-3 w-fit">
              <button
                type="button"
                role="switch"
                aria-checked={values.isActive}
                onClick={() => set("isActive", !values.isActive)}
                className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
                style={{
                  background: values.isActive ? "var(--color-foreground)" : "var(--color-surface-overlay)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <span
                  className="absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all duration-150"
                  style={{
                    background: values.isActive ? "var(--color-background)" : "var(--color-subtle)",
                    left: values.isActive ? "calc(100% - 16px)" : "2px",
                  }}
                />
              </button>
              <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
                {values.isActive ? "Activa" : "Pausada"}
              </span>
            </label>
            <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
              Las campañas pausadas no aparecen en la API pública.
            </p>
          </div>
        </Section>

        <Divider />

        {/* ── Submit ── */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving || ctaStatus === "invalid"}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
            style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {campaign ? "Guardar cambios" : "Crear campaña"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md px-4 py-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            Cancelar
          </button>
        </div>

        {error && (
          <p className="rounded-md px-3 py-2 text-xs" style={{ color: "var(--color-error)", background: "var(--color-error-bg)" }}>
            {error}
          </p>
        )}
      </form>
    </>
  );
}

function toHex(color: string): string {
  return color.startsWith("#") ? color : "#888888";
}
