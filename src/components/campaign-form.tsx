"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/trpc/react";
import { CURRENCIES } from "@/lib/currencies";
import { LOCALES } from "@/lib/locales";
import { slugify } from "@/lib/utils";
import { Loader2, Upload, Copy, Check, ExternalLink } from "lucide-react";

/* ─── Color presets ─── */
const COLOR_PRESETS = [
  { label: "Dorado",  primary: "oklch(0.74 0.19 55)",  bg: "oklch(0.16 0.04 265)" },
  { label: "Verde",   primary: "oklch(0.72 0.19 145)", bg: "oklch(0.15 0.04 165)" },
  { label: "Azul",    primary: "oklch(0.65 0.22 255)", bg: "oklch(0.14 0.05 255)" },
  { label: "Naranja", primary: "oklch(0.68 0.22 35)",  bg: "oklch(0.15 0.04 20)"  },
  { label: "Morado",  primary: "oklch(0.65 0.22 295)", bg: "oklch(0.14 0.05 280)" },
  { label: "Rosa",    primary: "oklch(0.72 0.18 350)", bg: "oklch(0.15 0.04 330)" },
];

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

/* ─── Field wrapper ─── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>{hint}</p>}
    </div>
  );
}

/* ─── Input ─── */
function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md px-3 py-2 text-sm outline-none transition-colors ${className}`}
      style={{
        background: "var(--color-surface-overlay)",
        border: "1px solid var(--color-border)",
        color: "var(--color-foreground)",
        ...((props.style) ?? {}),
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-border-focus)"; props.onFocus?.(e); }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; props.onBlur?.(e); }}
    />
  );
}

/* ─── Select ─── */
function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-md px-3 py-2 text-sm outline-none appearance-none cursor-pointer"
      style={{
        background: "var(--color-surface-overlay)",
        border: "1px solid var(--color-border)",
        color: "var(--color-foreground)",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-border-focus)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
    >
      {children}
    </select>
  );
}

/* ─── Section divider ─── */
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

/* ─── Main form ─── */
export function CampaignForm({ campaign }: { campaign?: Campaign }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [values, setValues] = useState<FormValues>({
    name: campaign?.name ?? "",
    slug: campaign?.slug ?? "",
    templateSlug: campaign?.templateSlug ?? "gonza-gb-sn-fc",
    locale: campaign?.locale ?? "en",
    currencyCode: campaign?.currencyCode ?? "GBP",
    currencySymbol: campaign?.currencySymbol ?? "£",
    ctaUrl: campaign?.ctaUrl ?? "",
    logoUrl: campaign?.logoUrl ?? "",
    colorPrimary: campaign?.colorPrimary ?? "oklch(0.74 0.19 55)",
    colorBg: campaign?.colorBg ?? "oklch(0.16 0.04 265)",
    isActive: campaign?.isActive ?? true,
  });

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      const payload = { ...values, logoUrl: values.logoUrl || null };
      if (campaign) update.mutate({ id: campaign.id, ...payload });
      else create.mutate(payload);
    });
  }

  function copySlugUrl() {
    const slug = values.slug || campaign?.slug;
    if (!slug) return;
    void navigator.clipboard.writeText(`${window.location.origin}/api/config/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isSaving = pending || create.isPending || update.isPending;
  const error = create.error?.message ?? update.error?.message;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Identidad ── */}
      <Section title="Identidad">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre">
            <Input
              placeholder="UK Marzo 2025"
              value={values.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </Field>

          <Field label="Slug (ID público)" hint="Usado como ?c=slug en tu plantilla">
            <div className="flex gap-2">
              <Input
                placeholder="uk-marzo-2025"
                value={values.slug}
                onChange={(e) => set("slug", e.target.value)}
                required
                className="flex-1"
              />
              {values.slug && (
                <button
                  type="button"
                  onClick={copySlugUrl}
                  title="Copiar URL"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors"
                  style={{
                    background: "var(--color-surface-overlay)",
                    border: "1px solid var(--color-border)",
                    color: copied ? "var(--color-success)" : "var(--color-muted-foreground)",
                  }}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </Field>
        </div>
      </Section>

      <Divider />

      {/* ── Mercado ── */}
      <Section title="Mercado">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Idioma / País">
            <Select value={values.locale} onChange={(e) => handleLocaleChange(e.target.value)}>
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Moneda" hint={`Símbolo activo: ${values.currencySymbol}`}>
            <Select value={values.currencyCode} onChange={(e) => handleCurrencyChange(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      <Divider />

      {/* ── CTA ── */}
      <Section title="CTA">
        <Field label="URL de afiliado">
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://taprkr.com/r/..."
              value={values.ctaUrl}
              onChange={(e) => set("ctaUrl", e.target.value)}
              required
              className="flex-1"
            />
            {values.ctaUrl && (
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
          {values.logoUrl && (
            <Image
              src={values.logoUrl}
              alt="Logo"
              width={56}
              height={56}
              className="h-14 w-14 rounded-lg object-contain"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}
            />
          )}
          <div className="flex flex-col gap-2 flex-1">
            <label
              className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: "var(--color-surface-overlay)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
              }}
            >
              <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? "Subiendo…" : "Subir logo"}
            </label>
            <Input
              placeholder="O pega una URL directamente"
              value={values.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
            />
          </div>
        </div>
      </Section>

      <Divider />

      {/* ── Colores ── */}
      <Section title="Colores">
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((p) => {
            const active = values.colorPrimary === p.primary;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => { set("colorPrimary", p.primary); set("colorBg", p.bg); }}
                className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors"
                style={{
                  border: `1px solid ${active ? "var(--color-border-focus)" : "var(--color-border)"}`,
                  background: active ? "var(--color-surface-overlay)" : "transparent",
                  color: active ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                }}
              >
                <span className="h-3 w-3 rounded-full shrink-0" style={{ background: p.primary }} />
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Color principal">
            <div className="flex gap-2 items-center">
              <input
                type="color"
                className="h-9 w-10 cursor-pointer rounded-md border-0 p-0.5"
                style={{
                  background: "var(--color-surface-overlay)",
                  border: "1px solid var(--color-border)",
                }}
                value={toHex(values.colorPrimary)}
                onChange={(e) => set("colorPrimary", e.target.value)}
              />
              <Input
                value={values.colorPrimary}
                onChange={(e) => set("colorPrimary", e.target.value)}
                placeholder="oklch(0.74 0.19 55)"
                className="flex-1 font-mono text-xs"
              />
            </div>
          </Field>

          <Field label="Color de fondo">
            <div className="flex gap-2 items-center">
              <input
                type="color"
                className="h-9 w-10 cursor-pointer rounded-md p-0.5"
                style={{
                  background: "var(--color-surface-overlay)",
                  border: "1px solid var(--color-border)",
                }}
                value={toHex(values.colorBg)}
                onChange={(e) => set("colorBg", e.target.value)}
              />
              <Input
                value={values.colorBg}
                onChange={(e) => set("colorBg", e.target.value)}
                placeholder="oklch(0.16 0.04 265)"
                className="flex-1 font-mono text-xs"
              />
            </div>
          </Field>
        </div>

        {/* Live preview */}
        <div
          className="flex items-center gap-4 rounded-xl p-5"
          style={{ background: values.colorBg, border: "1px solid var(--color-border)" }}
        >
          <div
            className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: values.colorPrimary }}
          >
            Aa
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">Preview</p>
            <p className="text-xs font-medium" style={{ color: values.colorPrimary }}>
              Color principal · {values.currencySymbol}99
            </p>
          </div>
        </div>
      </Section>

      <Divider />

      {/* ── Estado ── */}
      <Section title="Estado">
        <label className="flex cursor-pointer items-center gap-3">
          <div
            onClick={() => set("isActive", !values.isActive)}
            className="relative h-5 w-9 rounded-full transition-colors cursor-pointer"
            style={{ background: values.isActive ? "var(--color-success)" : "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}
          >
            <span
              className="absolute top-0.5 h-4 w-4 rounded-full transition-transform"
              style={{
                background: values.isActive ? "#000" : "var(--color-subtle)",
                left: values.isActive ? "calc(100% - 18px)" : "1px",
              }}
            />
          </div>
          <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
            {values.isActive ? "Campaña activa" : "Campaña pausada"}
          </span>
        </label>
        <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
          Las campañas pausadas no aparecen en la API pública.
        </p>
      </Section>

      <Divider />

      {/* ── Actions ── */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
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
        <p className="text-xs rounded-md px-3 py-2" style={{ color: "var(--color-error)", background: "var(--color-error-bg)" }}>
          {error}
        </p>
      )}
    </form>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "var(--color-border)" }} />;
}

function toHex(color: string): string {
  return color.startsWith("#") ? color : "#888888";
}
