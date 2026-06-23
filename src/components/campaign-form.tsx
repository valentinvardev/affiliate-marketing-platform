"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/trpc/react";
import { CURRENCIES } from "@/lib/currencies";
import { LOCALES } from "@/lib/locales";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, Copy, Check, ExternalLink } from "lucide-react";

const COLOR_PRESETS = [
  { label: "Dorado (default)",  primary: "oklch(0.74 0.19 55)",  bg: "oklch(0.16 0.04 265)" },
  { label: "Verde",             primary: "oklch(0.72 0.19 145)", bg: "oklch(0.15 0.04 165)" },
  { label: "Azul",              primary: "oklch(0.65 0.22 255)", bg: "oklch(0.14 0.05 255)" },
  { label: "Rojo/Naranja",      primary: "oklch(0.68 0.22 35)",  bg: "oklch(0.15 0.04 20)"  },
  { label: "Morado",            primary: "oklch(0.65 0.22 295)", bg: "oklch(0.14 0.05 280)" },
  { label: "Rosa",              primary: "oklch(0.72 0.18 350)", bg: "oklch(0.15 0.04 330)" },
];

type FormValues = {
  name: string;
  slug: string;
  templateSlug: string;
  locale: string;
  currencyCode: string;
  currencySymbol: string;
  ctaUrl: string;
  logoUrl: string;
  colorPrimary: string;
  colorBg: string;
  isActive: boolean;
};

type Campaign = {
  id: string;
  name: string;
  slug: string;
  templateSlug: string;
  locale: string;
  currencyCode: string;
  currencySymbol: string;
  ctaUrl: string;
  logoUrl: string | null;
  colorPrimary: string;
  colorBg: string;
  isActive: boolean;
};

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

  const create = api.campaign.create.useMutation({
    onSuccess: (c) => router.push(`/campaigns/${c.id}`),
  });
  const update = api.campaign.update.useMutation({
    onSuccess: () => router.refresh(),
  });

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function handleNameChange(name: string) {
    set("name", name);
    if (!campaign) set("slug", slugify(name));
  }

  function handleLocaleChange(locale: string) {
    const loc = LOCALES.find((l) => l.code === locale);
    set("locale", locale);
    if (loc) {
      const cur = CURRENCIES.find((c) => c.code === loc.defaultCurrencyCode);
      if (cur) {
        set("currencyCode", cur.code);
        set("currencySymbol", cur.symbol);
      }
    }
  }

  function handleCurrencyChange(code: string) {
    const cur = CURRENCIES.find((c) => c.code === code);
    if (cur) {
      set("currencyCode", cur.code);
      set("currencySymbol", cur.symbol);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) set("logoUrl", data.url);
    setUploading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(() => {
      const payload = {
        ...values,
        logoUrl: values.logoUrl || null,
      };
      if (campaign) {
        update.mutate({ id: campaign.id, ...payload });
      } else {
        create.mutate(payload);
      }
    });
  }

  function copySlugUrl() {
    const slug = values.slug || campaign?.slug;
    if (!slug) return;
    const url = `${window.location.origin}/api/config/${slug}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isSaving = pending || create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Identidad ── */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre de la campaña</Label>
          <Input
            id="name"
            placeholder="UK Marzo 2025"
            value={values.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug (ID público)</Label>
          <div className="flex gap-2">
            <Input
              id="slug"
              placeholder="uk-marzo-2025"
              value={values.slug}
              onChange={(e) => set("slug", e.target.value)}
              required
            />
            {(values.slug || campaign?.slug) && (
              <Button type="button" variant="outline" size="icon" onClick={copySlugUrl} title="Copiar URL de config">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            La plantilla lo usa como <code>?c=slug</code>
          </p>
        </div>
      </section>

      {/* ── Idioma y Moneda ── */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Idioma / Mercado</Label>
          <Select value={values.locale} onValueChange={handleLocaleChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.flag} {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Moneda</Label>
          <Select value={values.currencyCode} onValueChange={handleCurrencyChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Símbolo activo: <strong>{values.currencySymbol}</strong>
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="space-y-2">
        <Label htmlFor="ctaUrl">CTA URL (enlace de afiliado)</Label>
        <div className="flex gap-2">
          <Input
            id="ctaUrl"
            type="url"
            placeholder="https://taprkr.com/r/..."
            value={values.ctaUrl}
            onChange={(e) => set("ctaUrl", e.target.value)}
            required
          />
          {values.ctaUrl && (
            <Button type="button" variant="outline" size="icon" asChild>
              <a href={values.ctaUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* ── Logo ── */}
      <div className="space-y-2">
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          {values.logoUrl && (
            <Image
              src={values.logoUrl}
              alt="Logo preview"
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg object-contain border bg-white/5"
            />
          )}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleLogoUpload}
            />
            <span className="inline-flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm hover:bg-accent transition-colors">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Subiendo…" : "Subir logo"}
            </span>
          </label>
          {values.logoUrl && (
            <Input
              placeholder="O pega URL directamente"
              value={values.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
              className="flex-1"
            />
          )}
        </div>
        {!values.logoUrl && (
          <Input
            placeholder="URL del logo (opcional)"
            value={values.logoUrl}
            onChange={(e) => set("logoUrl", e.target.value)}
          />
        )}
      </div>

      {/* ── Colores ── */}
      <div className="space-y-4">
        <Label>Colores</Label>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                set("colorPrimary", p.primary);
                set("colorBg", p.bg);
              }}
              title={p.label}
              className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors hover:bg-accent"
              style={{
                borderColor:
                  values.colorPrimary === p.primary ? "currentColor" : "transparent",
              }}
            >
              <span
                className="h-4 w-4 rounded-full shrink-0"
                style={{ background: p.primary }}
              />
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="colorPrimary">Color principal</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                className="h-9 w-12 cursor-pointer rounded border border-input p-0.5"
                value={oklchToHex(values.colorPrimary)}
                onChange={(e) => set("colorPrimary", e.target.value)}
              />
              <Input
                id="colorPrimary"
                value={values.colorPrimary}
                onChange={(e) => set("colorPrimary", e.target.value)}
                placeholder="oklch(0.74 0.19 55) o #f59e0b"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="colorBg">Color de fondo</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                className="h-9 w-12 cursor-pointer rounded border border-input p-0.5"
                value={oklchToHex(values.colorBg)}
                onChange={(e) => set("colorBg", e.target.value)}
              />
              <Input
                id="colorBg"
                value={values.colorBg}
                onChange={(e) => set("colorBg", e.target.value)}
                placeholder="oklch(0.16 0.04 265) o #1e1b4b"
              />
            </div>
          </div>
        </div>

        {/* Preview de colores */}
        <div
          className="rounded-xl p-6 flex items-center gap-4"
          style={{ background: values.colorBg }}
        >
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ background: values.colorPrimary }}
          >
            A
          </div>
          <div>
            <p className="text-white font-bold">Preview de colores</p>
            <p style={{ color: values.colorPrimary }} className="text-sm font-semibold">
              Color principal
            </p>
          </div>
        </div>
      </div>

      {/* ── Estado ── */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="isActive"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
          className="h-4 w-4 cursor-pointer accent-primary"
        />
        <Label htmlFor="isActive">Campaña activa (visible en API pública)</Label>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {campaign ? "Guardar cambios" : "Crear campaña"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>

      {(create.error ?? update.error) && (
        <p className="text-sm text-red-500">
          {create.error?.message ?? update.error?.message}
        </p>
      )}
    </form>
  );
}

// Fallback hex para el <input type="color"> cuando se usa oklch
function oklchToHex(color: string): string {
  if (color.startsWith("#")) return color;
  // oklch no es parseado por el native color picker — devolvemos un gris
  return "#888888";
}
