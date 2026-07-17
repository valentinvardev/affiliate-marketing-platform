"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactCountryFlag from "react-country-flag";
import Image from "next/image";
import { api } from "@/trpc/react";
import { CURRENCIES } from "@/lib/currencies";
import { LOCALES } from "@/lib/locales";
import { slugify } from "@/lib/utils";
import { LANDING_FONTS } from "@/lib/fonts";
import { LANDING_TEMPLATES, resolveTemplate } from "@/lib/landing-templates";
import {
  Loader2, Upload, Check, X, ExternalLink, Smartphone, ChevronDown,
  ImageIcon, Bookmark, Link as LinkIcon, Search, ArrowRight, Rocket, Tag,
  Globe, Palette, Layers, Package, Copy, CreditCard,
} from "lucide-react";
import { OfferPickerModal } from "@/components/offer-picker-modal";

/* ─── Types ─── */
type UrlStatus = "idle" | "checking" | "valid" | "invalid";

type FormValues = {
  name: string; slug: string; templateSlug: string;
  locale: string; currencyCode: string; currencySymbol: string;
  ctaUrl: string; logoUrl: string;
  colorPrimary: string; colorBg: string; isActive: boolean;
  domain: string; fontTitle: string; fontBody: string;
  offerName: string; offerImage: string;
  vccLimit: string; // transitorio: límite inicial de la VCC auto-generada
};

type Campaign = {
  id: string; name: string; slug: string; templateSlug: string;
  locale: string; currencyCode: string; currencySymbol: string;
  ctaUrl: string; logoUrl: string | null;
  colorPrimary: string; colorBg: string; isActive: boolean;
  domain?: string | null; fontTitle?: string | null; fontBody?: string | null;
  offerName?: string | null; offerImage?: string | null;
};

type PreviewOffer = { name: string; amount: number; badge: string; imageUrl?: string | null };
const DEFAULT_OFFERS: PreviewOffer[] = [
  { name: "Block Blast", amount: 12, badge: "TOP" },
  { name: "Clash Royale", amount: 15, badge: "HOT" },
  { name: "Candy Crush", amount: 35, badge: "TOP" },
  { name: "Subway Surfers", amount: 12, badge: "HOT" },
];

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
      } catch { setStatus("invalid"); }
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [url]);
  return status;
}

/* ─── Base input ─── */
function Input({
  suffix, className = "", style: extraStyle, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { suffix?: React.ReactNode }) {
  const [focused, setFocused] = useState(false);
  if (suffix) {
    return (
      <div className="flex items-center rounded-md overflow-hidden transition-colors"
        style={{ border: `1px solid ${focused ? "var(--color-border-focus)" : "var(--color-border)"}`, background: "var(--color-surface-overlay)" }}>
        <input {...props} className={`flex-1 bg-transparent px-3 py-2 text-sm outline-none ${className}`}
          style={{ color: "var(--color-foreground)", ...extraStyle }}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }} />
        <div className="flex shrink-0 items-center pr-2.5">{suffix}</div>
      </div>
    );
  }
  return (
    <input {...props} className={`w-full rounded-md px-3 py-2 text-sm outline-none transition-colors ${className}`}
      style={{ background: "var(--color-surface-overlay)", border: `1px solid ${focused ? "var(--color-border-focus)" : "var(--color-border)"}`, color: "var(--color-foreground)", ...extraStyle }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }} />
  );
}

/* ─── Dropdown ─── */
function Dropdown({
  value, onChange, options,
}: {
  value: string; onChange: (value: string) => void;
  options: { value: string; label: string; prefix?: string; countryCode?: string; meta?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  useEffect(() => {
    function onMouse(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    if (open) document.addEventListener("mousedown", onMouse);
    return () => document.removeEventListener("mousedown", onMouse);
  }, [open]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => {
    if (!open || !listRef.current) return;
    (listRef.current.querySelector("[data-selected]") as HTMLElement | null)?.scrollIntoView({ block: "nearest" });
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors"
        style={{ background: "var(--color-surface-overlay)", border: `1px solid ${open ? "var(--color-border-focus)" : "var(--color-border)"}`, color: "var(--color-foreground)" }}>
        <span className="flex items-center gap-2 truncate">
          {selected?.countryCode && <ReactCountryFlag countryCode={selected.countryCode} svg style={{ width: "1.25em", height: "0.95em", borderRadius: 2, flexShrink: 0 }} />}
          {!selected?.countryCode && selected?.prefix && <span className="shrink-0 text-base leading-none">{selected.prefix}</span>}
          <span className="truncate">{selected?.label ?? "Seleccionar…"}</span>
          {selected?.meta && <span className="shrink-0 text-xs" style={{ color: "var(--color-subtle)" }}>{selected.meta}</span>}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform duration-150" style={{ color: "var(--color-subtle)", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg"
          style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}>
          <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button key={opt.value} type="button" data-selected={isSelected ? true : undefined}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors"
                  style={{ background: isSelected ? "rgba(255,255,255,0.06)" : "transparent", color: isSelected ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "var(--color-foreground)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = isSelected ? "rgba(255,255,255,0.06)" : "transparent"; e.currentTarget.style.color = isSelected ? "var(--color-foreground)" : "var(--color-muted-foreground)"; }}>
                  {opt.countryCode && <ReactCountryFlag countryCode={opt.countryCode} svg style={{ width: "1.25em", height: "0.95em", borderRadius: 2, flexShrink: 0 }} />}
                  {!opt.countryCode && opt.prefix && <span className="shrink-0 text-base leading-none">{opt.prefix}</span>}
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.meta && <span className="shrink-0 text-[11px]" style={{ color: "var(--color-subtle)" }}>{opt.meta}</span>}
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-success)" }} />}
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
      <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>
      {children}
      {hint && <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>{hint}</p>}
    </div>
  );
}

function UrlIndicator({ status }: { status: UrlStatus }) {
  if (status === "idle") return null;
  if (status === "checking") return <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-subtle)" }} />;
  if (status === "valid") return <Check className="h-4 w-4" style={{ color: "var(--color-success)" }} />;
  return <X className="h-4 w-4" style={{ color: "var(--color-error)" }} />;
}

/* base64url para pasar la config al iframe de preview */
function toB64Url(s: string): string {
  const b64 = btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* ═══════════════════════════════════════════════
   PREVIEW REAL — iframe a la plantilla en un marco de teléfono
═══════════════════════════════════════════════ */
function PreviewFrame({ url }: { url: string }) {
  return (
    <div className="relative overflow-hidden"
      style={{ width: 320, height: 640, borderRadius: 40, border: "9px solid #1a1a1a", boxShadow: "0 0 0 2px #2a2a2a, 0 30px 60px rgba(0,0,0,0.6)", background: "#000" }}>
      {url ? (
        <iframe src={url} title="Preview de la landing" style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
      ) : (
        <div className="flex h-full items-center justify-center text-xs" style={{ color: "var(--color-subtle)" }}>Completá la campaña…</div>
      )}
    </div>
  );
}

/* ─── Saved CTA URLs (localStorage) ─── */
const SAVED_URLS_KEY = "aff_saved_cta_urls";
type SavedUrl = { id: string; name: string; url: string };
function useSavedUrls() {
  const [items, setItems] = useState<SavedUrl[]>([]);
  useEffect(() => {
    try { const raw = localStorage.getItem(SAVED_URLS_KEY); if (raw) setItems(JSON.parse(raw) as SavedUrl[]); } catch {}
  }, []);
  function saveUrl(name: string, url: string) {
    const next = [...items, { id: `${Date.now()}`, name, url }];
    setItems(next); localStorage.setItem(SAVED_URLS_KEY, JSON.stringify(next));
  }
  function deleteUrl(id: string) {
    const next = items.filter((i) => i.id !== id);
    setItems(next); localStorage.setItem(SAVED_URLS_KEY, JSON.stringify(next));
  }
  return { items, saveUrl, deleteUrl };
}

function SavedUrlDropdown({ items, onSelect, onDelete }: { items: SavedUrl[]; onSelect: (url: string) => void; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onMouse(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    if (open) document.addEventListener("mousedown", onMouse);
    return () => document.removeEventListener("mousedown", onMouse);
  }, [open]);
  return (
    <div ref={ref} className="relative mt-2">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm"
        style={{ background: "var(--color-surface-overlay)", border: `1px solid ${open ? "var(--color-border-focus)" : "var(--color-border)"}`, color: "var(--color-muted-foreground)" }}>
        <span className="flex items-center gap-2"><Bookmark className="h-3.5 w-3.5 shrink-0" /><span>URLs guardadas ({items.length})</span></span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform duration-150" style={{ transform: open ? "rotate(180deg)" : "none", color: "var(--color-subtle)" }} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}>
          <div className="max-h-48 overflow-y-auto py-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 px-3 py-2 transition-colors" style={{ color: "var(--color-muted-foreground)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <button type="button" className="flex flex-1 items-center gap-2 text-left text-sm" style={{ color: "var(--color-foreground)" }} onClick={() => { onSelect(item.url); setOpen(false); }}>
                  <LinkIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
                  <span className="flex-1 truncate font-medium">{item.name}</span>
                  <span className="max-w-[140px] truncate text-[11px]" style={{ color: "var(--color-subtle)" }}>{item.url}</span>
                </button>
                <button type="button" onClick={() => onDelete(item.id)} className="shrink-0 transition-opacity hover:opacity-70" title="Eliminar" style={{ color: "var(--color-subtle)" }}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CAMPAIGN STUDIO
═══════════════════════════════════════════════ */
export function CampaignForm({ campaign }: { campaign?: Campaign }) {
  const router = useRouter();
  const isEdit = !!campaign;
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [created, setCreated] = useState(false);
  const [savedInfo, setSavedInfo] = useState<{ id: string; slug: string; domain: string | null } | null>(null);
  const [copiedSaved, setCopiedSaved] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);

  const { data: colorPresets = [] } = api.preset.colorList.useQuery();
  const { data: logoPresets = [] } = api.preset.logoList.useQuery();
  const { data: stacks = [] } = api.stack.list.useQuery();
  const { data: hosts = [] } = api.domains.hosts.useQuery();
  const { data: offerPkgs = [] } = api.offer.packages.useQuery(undefined, { enabled: !campaign });

  function applyOfferPackage(offerId: string) {
    const pkg = offerPkgs.find((p) => p.offerId === offerId);
    if (!pkg) return;
    // selectedOffer todavía es la selección ANTERIOR (setSelectedOffer es async).
    const prevOffer = offerPkgs.find((p) => p.offerId === selectedOffer);
    setValues((p) => {
      // El nombre se reemplaza si está vacío o si quedó auto-puesto por la oferta anterior.
      const autoName = !p.name.trim() || (!!prevOffer && p.name === prevOffer.offerName);
      return {
        ...p,
        colorPrimary: pkg.colorPrimary ?? "oklch(0.74 0.19 55)",
        colorBg:      pkg.colorBg ?? "oklch(0.16 0.04 265)",
        logoUrl:      pkg.logoUrl ?? "",
        domain:       pkg.domain ?? "",
        fontTitle:    pkg.fontTitle ?? "",
        fontBody:     pkg.fontBody ?? "",
        name:         autoName ? pkg.offerName : p.name,
        offerName:    pkg.offerName,
        offerImage:   pkg.offerImage ?? "",
        // el slug (subid) se define en "Buscar oferta", no acá
      };
    });
    // Apps sueltas tienen prioridad sobre el stack (ofertas tipo teststar/empfohlen).
    if (pkg.appIds && pkg.appIds.length) {
      setPendingAppIds(pkg.appIds);
      setPendingAppsData(pkg.apps ?? []);
      setPendingStackId(null);
    } else {
      setPendingStackId(pkg.appStackId ?? null);
      setPendingAppIds([]);
      setPendingAppsData([]);
    }
  }
  const { items: savedUrls, saveUrl, deleteUrl } = useSavedUrls();
  const [savingUrl, setSavingUrl] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [pendingStackId, setPendingStackId] = useState<string | null>(null);
  const [pendingAppIds, setPendingAppIds] = useState<string[]>([]);
  const [pendingAppsData, setPendingAppsData] = useState<{ name: string; imageUrl: string | null; badge: string; amount: number }[]>([]);
  const [selectedOffer, setSelectedOffer] = useState("");

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
    domain: campaign?.domain ?? "",
    fontTitle: campaign?.fontTitle ?? "",
    fontBody: campaign?.fontBody ?? "",
    offerName: campaign?.offerName ?? "",
    offerImage: campaign?.offerImage ?? "",
    vccLimit: "",
  });

  const ctaStatus = useUrlStatus(values.ctaUrl);
  const applyStack = api.stack.applyToCampaign.useMutation();
  const applyApps = api.stack.applyAppsToCampaign.useMutation();
  const createVcc = api.cards.createForCampaign.useMutation();

  async function applyAppsOrStack(campaignId: string) {
    if (pendingAppIds.length) await applyApps.mutateAsync({ campaignId, appIds: pendingAppIds });
    else if (pendingStackId) await applyStack.mutateAsync({ stackId: pendingStackId, campaignId });
  }

  const create = api.campaign.create.useMutation({
    onSuccess: async (c) => {
      await applyAppsOrStack(c.id);
      // VCC automática de la campaña ({campaña} 1) con el límite inicial.
      const lim = parseFloat(values.vccLimit);
      if (lim > 0) { try { await createVcc.mutateAsync({ campaignId: c.id, spendLimit: lim }); } catch { /* best-effort */ } }
      setCreated(true);
      setTimeout(() => router.push(`/campaigns/${c.id}`), 1600);
    },
  });
  const update = api.campaign.update.useMutation({
    onSuccess: async (c) => {
      await applyAppsOrStack(c.id);
      setPendingStackId(null);
      router.refresh();
      setSavedInfo({ id: c.id, slug: c.slug, domain: c.domain ?? null });
    },
  });

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) { setValues((p) => ({ ...p, [key]: val })); }
  function handleNameChange(name: string) { set("name", name); }
  function handleLocaleChange(locale: string) {
    set("locale", locale);
    const loc = LOCALES.find((l) => l.code === locale);
    if (loc) { const cur = CURRENCIES.find((c) => c.code === loc.defaultCurrencyCode); if (cur) { set("currencyCode", cur.code); set("currencySymbol", cur.symbol); } }
  }
  function handleCurrencyChange(code: string) { const cur = CURRENCIES.find((c) => c.code === code); if (cur) { set("currencyCode", cur.code); set("currencySymbol", cur.symbol); } }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) return;
      const data = (await res.json()) as { url?: string };
      if (data.url) set("logoUrl", data.url);
    } catch { /* ignore */ } finally { setUploading(false); }
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    startTransition(() => {
      const payload = { ...values, logoUrl: values.logoUrl || null, domain: values.domain || null, fontTitle: values.fontTitle || null, fontBody: values.fontBody || null, offerName: values.offerName || null, offerImage: values.offerImage || null };
      if (campaign) update.mutate({ id: campaign.id, ...payload });
      else create.mutate(payload);
    });
  }

  const isSaving = pending || create.isPending || update.isPending || applyStack.isPending;
  const error = create.error?.message ?? update.error?.message;

  /* ── Pasos ── */
  const hasStacks = stacks.length > 0;
  const [active, setActive] = useState<string>("identidad");
  const [visited, setVisited] = useState<Set<string>>(() => new Set(["identidad"]));
  useEffect(() => { setVisited((v) => (v.has(active) ? v : new Set(v).add(active))); }, [active]);

  // Campos no opcionales de cada paso. Sólo cuando se cumplen el paso queda "hecho".
  function stepValid(key: string): boolean {
    switch (key) {
      case "identidad": return !!values.name.trim();
      case "mercado":   return !!values.locale && !!values.currencyCode;
      case "oferta":    return ctaStatus === "valid";
      case "marca":     return !!values.colorPrimary && !!values.colorBg;
      default:          return true; // apps (opcional), lanzar
    }
  }

  const stepDefs = [
    { key: "identidad", label: "Identidad", icon: Tag },
    { key: "mercado",   label: "Mercado",   icon: Globe },
    { key: "oferta",    label: "Oferta",    icon: LinkIcon },
    { key: "marca",     label: "Marca",     icon: Palette },
    ...(hasStacks ? [{ key: "apps", label: "Apps", icon: Layers }] : []),
    { key: "lanzar",    label: "Lanzar",    icon: Rocket },
  ].map((s) => ({ ...s, done: s.key !== "lanzar" && visited.has(s.key) && stepValid(s.key) }));

  const contentSteps = stepDefs.filter((s) => s.key !== "lanzar");
  const progress = Math.round((contentSteps.filter((s) => s.done).length / contentSteps.length) * 100);
  const canSubmit = !isSaving && ctaStatus !== "invalid" && !!values.name && !!values.ctaUrl;
  const idx = stepDefs.findIndex((s) => s.key === active);
  const next = stepDefs[idx + 1];
  const isLanzar = active === "lanzar";

  // Offers para el preview: apps sueltas > stack > default
  const previewOffers: PreviewOffer[] = pendingAppIds.length
    ? pendingAppsData.map((a) => ({ name: a.name, amount: a.amount, badge: a.badge, imageUrl: a.imageUrl }))
    : pendingStackId
      ? (stacks.find((s) => s.id === pendingStackId)?.items.map((it) => ({ name: it.name, amount: it.amount, badge: it.badge, imageUrl: it.imageUrl })) ?? [])
      : DEFAULT_OFFERS;

  // URL del preview real (iframe a /landing-preview con la config codificada)
  const [previewUrl, setPreviewUrl] = useState("");
  const offersKey = JSON.stringify(previewOffers);
  useEffect(() => {
    const cfg = {
      name: values.name || "Preview",
      locale: values.locale,
      colorPrimary: values.colorPrimary,
      colorBg: values.colorBg,
      ctaUrl: values.ctaUrl || "#",
      logoUrl: values.logoUrl || null,
      currencySymbol: values.currencySymbol,
      currencyCode: values.currencyCode,
      templateSlug: values.templateSlug,
      fontTitle: values.fontTitle || null,
      fontBody: values.fontBody || null,
      offers: previewOffers.map((o, i) => ({ id: String(i), name: o.name, imageUrl: o.imageUrl ?? null, tag: "1 hr", badge: o.badge, amount: o.amount, rating: 4.9, note: null })),
    };
    const t = setTimeout(() => setPreviewUrl(`/landing-preview?c=${toB64Url(JSON.stringify(cfg))}`), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.name, values.locale, values.colorPrimary, values.colorBg, values.ctaUrl, values.logoUrl, values.currencySymbol, values.currencyCode, values.templateSlug, values.fontTitle, values.fontBody, offersKey]);

  return (
    <div className={`flex flex-col ${isEdit ? "" : "h-full min-h-0"}`}>
      <OfferPickerModal open={offerModalOpen} onClose={() => setOfferModalOpen(false)}
        onSelect={(url, s1) => { set("ctaUrl", url); if (s1) set("slug", slugify(s1)); setOfferModalOpen(false); }} defaultS1={values.slug} />

      {/* Created animation */}
      {created && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4" style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: "var(--color-foreground)", display: "flex", alignItems: "center", justifyContent: "center", animation: "successPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}>
            <svg width="38" height="38" viewBox="0 0 36 36" fill="none">
              <polyline points="7,18 15,26 29,10" stroke="var(--color-background)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: "checkDraw 0.4s ease 0.35s forwards" }} />
            </svg>
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>¡Campaña creada!</p>
        </div>
      )}

      {/* Cambios guardados — confirmación con URL + acciones */}
      {savedInfo && (() => {
        const url = savedInfo.domain
          ? `https://${savedInfo.domain}/${savedInfo.slug}`
          : (typeof window !== "undefined" ? `${window.location.origin}/landing/${savedInfo.slug}` : `/landing/${savedInfo.slug}`);
        const copy = async () => {
          try { await navigator.clipboard.writeText(url); setCopiedSaved(true); setTimeout(() => setCopiedSaved(false), 1600); } catch { /* bloqueado */ }
        };
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
            onClick={() => setSavedInfo(null)}>
            <div className="w-full max-w-sm rounded-2xl p-6" onClick={(e) => e.stopPropagation()}
              style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", animation: "successPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}>
              <div className="flex flex-col items-center text-center">
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-foreground)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check className="h-7 w-7" style={{ color: "var(--color-background)" }} />
                </div>
                <p className="mt-3 text-base font-semibold" style={{ color: "var(--color-foreground)" }}>Cambios guardados</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  {savedInfo.domain ? "La landing ya está actualizada." : "Asignale un dominio para publicarla en dominio/slug."}
                </p>
              </div>

              {/* URL + copiar */}
              <div className="mt-5">
                <label className="text-[11px] font-medium" style={{ color: "var(--color-muted-foreground)" }}>Link de la campaña</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input readOnly value={url} onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 rounded-md px-3 py-2 text-xs outline-none"
                    style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }} />
                  <button type="button" onClick={copy} title="Copiar"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors"
                    style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)", color: copiedSaved ? "var(--color-success)" : "var(--color-muted-foreground)" }}>
                    {copiedSaved ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => router.push("/campaigns")}
                  className="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
                  Volver
                </button>
                <button type="button" onClick={() => router.push(`/campaigns/${savedInfo.id}`)}
                  className="flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
                  Entrar a la campaña
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex min-h-0 flex-1">
        {/* ── Columna form ── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Stepper */}
          <div className="flex shrink-0 gap-1.5 overflow-x-auto px-4 py-3 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
            {stepDefs.map((s, i) => {
              const on = active === s.key;
              return (
                <button key={s.key} type="button" onClick={() => setActive(s.key)}
                  className="flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: on ? "var(--color-surface-overlay)" : "transparent",
                    border: `1px solid ${on ? "var(--color-border-focus)" : "var(--color-border)"}`,
                    color: on ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                  }}>
                  <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                    style={{ background: s.done ? "var(--color-foreground)" : "transparent", color: s.done ? "var(--color-background)" : on ? "var(--color-foreground)" : "var(--color-subtle)", border: s.done ? "none" : `1px solid ${on ? "var(--color-foreground)" : "var(--color-border)"}` }}>
                    {s.done ? <Check className="h-2.5 w-2.5" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active section */}
          <div className="flex-1 overflow-y-auto px-4 pt-6 pb-28 md:px-8 md:pb-24" key={active} style={{ animation: "lpStepIn .34s cubic-bezier(0.22,1,0.36,1)" }}>
            <div className="mx-auto max-w-xl space-y-5">
              {active === "identidad" && (
                <>
                  <StepHead title="Identidad" sub="Elegí una oferta para autocompletar todo, o cargá los datos a mano." />

                  {/* Empezar desde una oferta — autocompleta colores, logo, fuentes, apps y dominio */}
                  {!campaign && offerPkgs.length > 0 && (
                    <div className="rounded-xl p-3.5" style={{ border: "1px solid var(--color-border-focus)", background: "linear-gradient(180deg, var(--color-surface-overlay), transparent)" }}>
                      <div className="mb-2.5 flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--color-foreground)" }}>
                          <Package className="h-4 w-4" style={{ color: "var(--color-background)" }} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Empezar desde una oferta</p>
                          <p className="text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>Autocompleta colores, logo, fuentes, apps y dominio.</p>
                        </div>
                      </div>
                      <Dropdown
                        value={selectedOffer}
                        onChange={(v) => { setSelectedOffer(v); if (v) applyOfferPackage(v); }}
                        options={[{ value: "", label: "Elegí una oferta…" }, ...offerPkgs.map((p) => ({ value: p.offerId, label: p.offerName }))]}
                      />
                    </div>
                  )}

                  <Field label="Nombre"><Input placeholder="UK Marzo 2025" value={values.name} onChange={(e) => handleNameChange(e.target.value)} required /></Field>

                  <Field label="Dominio" hint="La landing queda en dominio/slug. Lo trae la oferta; podés cambiarlo.">
                    <Dropdown
                      value={values.domain}
                      onChange={(v) => set("domain", v)}
                      options={[{ value: "", label: "Sin dominio" }, ...hosts.map((h) => ({ value: h, label: h }))]}
                    />
                  </Field>

                  {/* URL pública resultante — sólo cuando ya hay slug (lo trae "Buscar oferta") */}
                  {values.slug && (
                    <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
                      <Globe className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-success)" }} />
                      <span className="truncate font-mono" style={{ color: "var(--color-foreground)" }}>
                        {values.domain ? `https://${values.domain}/${values.slug}` : `slug: ${values.slug}`}
                      </span>
                    </div>
                  )}
                </>
              )}

              {active === "mercado" && (
                <>
                  <StepHead title="Mercado" sub="Idioma/país y moneda. El preview se actualiza al instante." />
                  <Field label="Idioma / País"><Dropdown value={values.locale} onChange={handleLocaleChange} options={LOCALES.map((l) => ({ value: l.code, label: l.label, countryCode: l.countryCode }))} /></Field>
                  <Field label="Moneda" hint={`Símbolo: ${values.currencySymbol}`}><Dropdown value={values.currencyCode} onChange={handleCurrencyChange} options={CURRENCIES.map((c) => ({ value: c.code, label: c.label, meta: c.symbol }))} /></Field>
                </>
              )}

              {active === "oferta" && (
                <>
                  <StepHead title="Oferta / CTA" sub="La URL de afiliado a la que apunta el botón. Sin tracking válido la campaña no convierte." />
                  <Field label="URL de afiliado">
                    <Input type="url" placeholder="https://taprkr.com/r/..." value={values.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} required
                      style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }} suffix={<UrlIndicator status={ctaStatus} />} />
                    <div className="mt-2 flex gap-2">
                      <button type="button" disabled={ctaStatus !== "valid"} onClick={() => window.open(values.ctaUrl, "_blank", "noopener,noreferrer")}
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-40"
                        style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}><ExternalLink className="h-3.5 w-3.5" />Abrir</button>
                      <button type="button" disabled={ctaStatus !== "valid"} onClick={() => { setSavingUrl(true); setSaveName(""); }}
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-40"
                        style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}><Bookmark className="h-3.5 w-3.5" />Guardar</button>
                      <button type="button" onClick={() => setOfferModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
                        style={{ background: "var(--color-foreground)", border: "1px solid var(--color-border)", color: "var(--color-background)" }}><Search className="h-3.5 w-3.5" />Buscar oferta</button>
                    </div>
                    {savingUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <Input autoFocus placeholder="Nombre para esta URL…" value={saveName} onChange={(e) => setSaveName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" && saveName.trim()) { saveUrl(saveName.trim(), values.ctaUrl); setSavingUrl(false); } if (e.key === "Escape") setSavingUrl(false); }} />
                        <button type="button" disabled={!saveName.trim()} onClick={() => { saveUrl(saveName.trim(), values.ctaUrl); setSavingUrl(false); }}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md disabled:opacity-40" style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}><Check className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => setSavingUrl(false)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}><X className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                    {savedUrls.length > 0 && !savingUrl && <SavedUrlDropdown items={savedUrls} onSelect={(url) => set("ctaUrl", url)} onDelete={deleteUrl} />}
                  </Field>
                </>
              )}

              {active === "marca" && (
                <>
                  <StepHead title="Marca" sub="Logo y colores. El color principal también pinta el CTA del preview." />
                  {/* Logo */}
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
                        {uploading ? <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-muted-foreground)" }} /> : values.logoUrl ? (
                          <><Image src={values.logoUrl} alt="Logo" fill className="object-contain p-2" /><button type="button" onClick={() => set("logoUrl", "")} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full" style={{ background: "rgba(0,0,0,0.7)", color: "white" }}><X className="h-3 w-3" /></button></>
                        ) : <ImageIcon className="h-7 w-7" style={{ color: "var(--color-subtle)" }} />}
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
                        <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} /><Upload className="h-4 w-4" />Subir logo
                      </label>
                    </div>
                    {logoPresets.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {logoPresets.map((p) => {
                          const on = values.logoUrl === p.imageUrl;
                          return (
                            <button key={p.id} type="button" title={p.name} onClick={() => set("logoUrl", p.imageUrl)}
                              className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl transition-opacity hover:opacity-80"
                              style={{ border: `1px solid ${on ? "var(--color-border-focus)" : "var(--color-border)"}`, background: "var(--color-surface-overlay)", outline: on ? "2px solid var(--color-foreground)" : "none", outlineOffset: 2 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.imageUrl} alt={p.name} className="h-12 w-12 object-contain p-1" />
                              {on && <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: "var(--color-foreground)" }}><Check className="h-2.5 w-2.5" style={{ color: "var(--color-background)" }} /></span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Colores */}
                  {colorPresets.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {colorPresets.map((p) => {
                        const on = values.colorPrimary === p.colorPrimary;
                        return (
                          <button key={p.id} type="button" onClick={() => { set("colorPrimary", p.colorPrimary); set("colorBg", p.colorBg); }}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors"
                            style={{ border: `1px solid ${on ? "var(--color-border-focus)" : "var(--color-border)"}`, background: on ? "var(--color-surface-overlay)" : "transparent", color: on ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}>
                            <span className="flex gap-0.5 shrink-0"><span className="h-3.5 w-3.5 rounded-sm" style={{ background: p.colorPrimary }} /><span className="h-3.5 w-3.5 rounded-sm" style={{ background: p.colorBg }} /></span>
                            {p.name}{on && <Check className="h-3 w-3 shrink-0" style={{ color: "var(--color-success)" }} />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--color-subtle)" }}>Sin presets. El admin puede agregar en <a href="/admin?tab=colors" className="underline" style={{ color: "var(--color-muted-foreground)" }}>/admin → Colores</a>.</p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Color principal">
                      <div className="flex gap-2">
                        <input type="color" className="h-9 w-10 cursor-pointer rounded-md p-0.5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }} value={toHex(values.colorPrimary)} onChange={(e) => set("colorPrimary", e.target.value)} />
                        <Input value={values.colorPrimary} onChange={(e) => set("colorPrimary", e.target.value)} placeholder="oklch(0.74 0.19 55)" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }} />
                      </div>
                    </Field>
                    <Field label="Color de fondo">
                      <div className="flex gap-2">
                        <input type="color" className="h-9 w-10 cursor-pointer rounded-md p-0.5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }} value={toHex(values.colorBg)} onChange={(e) => set("colorBg", e.target.value)} />
                        <Input value={values.colorBg} onChange={(e) => set("colorBg", e.target.value)} placeholder="oklch(0.16 0.04 265)" style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }} />
                      </div>
                    </Field>
                  </div>
                  {/* Fuentes */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Fuente de títulos">
                      <Dropdown value={values.fontTitle} onChange={(v) => set("fontTitle", v)}
                        options={[{ value: "", label: "Inter (default)" }, ...LANDING_FONTS.map((f) => ({ value: f, label: f }))]} />
                    </Field>
                    <Field label="Fuente de párrafos">
                      <Dropdown value={values.fontBody} onChange={(v) => set("fontBody", v)}
                        options={[{ value: "", label: "Inter (default)" }, ...LANDING_FONTS.map((f) => ({ value: f, label: f }))]} />
                    </Field>
                  </div>
                  {/* Plantilla de landing */}
                  <Field label="Plantilla" hint="Diseño de la landing (previsualizá cada una en Admin → Plantillas)">
                    <Dropdown value={resolveTemplate(values.templateSlug)} onChange={(v) => set("templateSlug", v)}
                      options={LANDING_TEMPLATES.map((t) => ({ value: t.slug, label: t.name }))} />
                  </Field>
                </>
              )}

              {active === "apps" && hasStacks && (
                <>
                  <StepHead title="Aplicaciones" sub="Elegí un stack de apps para mostrar en la landing. Se aplica al guardar." />
                  <div className="flex flex-wrap gap-2">
                    {stacks.map((s) => {
                      const on = pendingStackId === s.id;
                      return (
                        <button key={s.id} type="button" onClick={() => setPendingStackId(on ? null : s.id)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors"
                          style={{ border: `1px solid ${on ? "var(--color-border-focus)" : "var(--color-border)"}`, background: on ? "var(--color-surface-overlay)" : "transparent", color: on ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}>
                          <span className="font-medium">{s.name}</span><span style={{ color: "var(--color-subtle)" }}>{s.items.length} apps</span>
                          {on && <Check className="h-3 w-3 shrink-0" style={{ color: "var(--color-foreground)" }} />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {active === "lanzar" && (
                <>
                  <StepHead title="Lanzar" sub="Revisá y creá la campaña." />
                  <div className="grid grid-cols-2 gap-3">
                    <ReviewItem label="Nombre" value={values.name || "—"} />
                    <ReviewItem label="Slug" value={values.slug || "—"} mono />
                    <ReviewItem label="Mercado" value={`${LOCALES.find((l) => l.code === values.locale)?.label ?? values.locale} · ${values.currencyCode}`} />
                    <ReviewItem label="CTA" value={ctaStatus === "valid" ? "válida ✓" : ctaStatus === "invalid" ? "inválida ✗" : "—"} />
                    <ReviewItem label="Apps" value={pendingStackId ? `${stacks.find((s) => s.id === pendingStackId)?.items.length ?? 0}` : "default"} />
                    <div className="rounded-lg p-3" style={{ border: "1px solid var(--color-border)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>Color</p>
                      <div className="mt-1.5 flex gap-1"><span className="h-4 w-4 rounded" style={{ background: values.colorPrimary }} /><span className="h-4 w-4 rounded" style={{ background: values.colorBg }} /></div>
                    </div>
                  </div>

                  {/* Primera VCC de la campaña */}
                  {!campaign && (
                    <div className="rounded-xl p-4" style={{ border: "1px solid var(--color-border-focus)", background: "linear-gradient(180deg, var(--color-surface-overlay), transparent)" }}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" style={{ color: "var(--color-foreground)" }} />
                        <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Primera tarjeta (VCC)</p>
                      </div>
                      <p className="mt-1 text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>
                        Al crear, se genera <span className="font-mono" style={{ color: "var(--color-foreground)" }}>{(values.name || "campaña")} 1</span> con este límite. Vacío = no crear ninguna.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-sm" style={{ color: "var(--color-subtle)" }}>$</span>
                        <Input value={values.vccLimit} onChange={(e) => set("vccLimit", e.target.value)} placeholder="50" type="number" />
                      </div>
                    </div>
                  )}

                  {error && <p className="rounded-md px-3 py-2 text-xs" style={{ color: "var(--color-error)", background: "var(--color-error-bg)" }}>{error}</p>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Preview real (desktop, solo al crear) ── */}
        {!isEdit && (
          <aside className="hidden shrink-0 justify-center p-6 lg:flex lg:sticky lg:top-0 lg:self-start" style={{ width: 400, borderLeft: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
            <PreviewFrame url={previewUrl} />
          </aside>
        )}
      </div>

      {/* ── Action bar (fija al fondo del viewport) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3 md:left-60 md:px-8" style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        {/* progreso */}
        <div className="hidden flex-1 items-center gap-2 sm:flex">
          <div className="h-1 w-32 overflow-hidden rounded-full" style={{ background: "var(--color-surface-overlay)" }}>
            <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--color-foreground)" }} />
          </div>
          <span className="text-[11px] tabular-nums" style={{ color: "var(--color-subtle)" }}>{progress}%</span>
        </div>
        <div className="flex flex-1 items-center gap-2 sm:flex-none">
          <button type="button" onClick={() => setMobilePreview(true)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium ${isEdit ? "" : "lg:hidden"}`} style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
            <Smartphone className="h-3.5 w-3.5" />Preview
          </button>
          <button type="button" onClick={() => router.back()} className="rounded-md px-3 py-2 text-sm transition-opacity hover:opacity-70" style={{ color: "var(--color-muted-foreground)" }}>Cancelar</button>
          {!isEdit && !isLanzar ? (
            <button key="next" type="button" disabled={!stepValid(active)} onClick={() => next && setActive(next.key)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-40 sm:flex-none"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
              Siguiente <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button key="submit" type="button" onClick={() => handleSubmit()} disabled={!canSubmit}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-40 sm:flex-none"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)", animation: !isEdit ? "lpPop .4s cubic-bezier(0.175,0.885,0.32,1.275)" : undefined }}>
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5" />}
              {campaign ? "Guardar cambios" : "Crear campaña"}
            </button>
          )}
        </div>
      </div>

      {/* ── Preview sheet ── */}
      {mobilePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} onClick={() => setMobilePreview(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <PreviewFrame url={previewUrl} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes successPop { 0% { transform: scale(0); opacity: 0; } 70% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes checkDraw { to { stroke-dashoffset: 0; } }
        @keyframes lpPop { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes lpRise { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes lpFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lpStepIn { from { opacity: 0; transform: translateX(26px); } to { opacity: 1; transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) { [style*="animation"] { animation: none !important; } }
      `}</style>
    </div>
  );
}

function StepHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-brand)", color: "var(--color-foreground)" }}>{title}</h2>
      <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>{sub}</p>
    </div>
  );
}

function ReviewItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg p-3" style={{ border: "1px solid var(--color-border)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>{label}</p>
      <p className="mt-1 truncate text-sm" style={{ color: "var(--color-foreground)", fontFamily: mono ? "var(--font-mono)" : undefined }}>{value}</p>
    </div>
  );
}

function toHex(color: string): string { return color.startsWith("#") ? color : "#888888"; }
