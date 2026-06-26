"use client";

import { useTransition, useRef, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { Check, Upload, Loader2, Monitor, Smartphone, AlertCircle, Layers, Palette, Image as ImageIcon, Globe } from "lucide-react";
import { toggleOfferWhitelist, updateOfferImage } from "./actions";
import { api } from "@/trpc/react";
import type { Offer } from "@/lib/taprain";

type Config = {
  whitelisted: boolean; imageUrl: string | null; appStackId: string | null;
  colorPresetId: string | null; logoPresetId: string | null; domain: string | null;
} | null;

export function OfferConfigRow({ offer, config }: { offer: Offer; config: Config }) {
  const [pending, start]               = useTransition();
  const [uploading, setUploading]      = useState(false);
  const [uploadError, setUploadError]  = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(config?.imageUrl ?? null);
  const [stackId, setStackId]          = useState<string | null>(config?.appStackId ?? null);
  const [colorId, setColorId]          = useState<string | null>(config?.colorPresetId ?? null);
  const [logoId, setLogoId]            = useState<string | null>(config?.logoPresetId ?? null);
  const [domain, setDomain]            = useState<string | null>(config?.domain ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: stacks = [] } = api.stack.list.useQuery();
  const { data: colors = [] } = api.preset.colorList.useQuery();
  const { data: logos = []  } = api.preset.logoList.useQuery();
  const { data: hosts = []  } = api.domains.hosts.useQuery();
  const linkStack = api.stack.linkToOffer.useMutation({
    onSuccess: (data) => setStackId(data.appStackId),
  });
  const setPkg = api.stack.setOfferPackage.useMutation();
  const savePkg = (patch: { colorPresetId?: string | null; logoPresetId?: string | null; domain?: string | null }) =>
    setPkg.mutate({ offerId: offer.id, offerName: offer.name, ...patch });

  const whitelisted = config?.whitelisted ?? false;
  const imageUrl    = localImageUrl ?? offer.image_url;

  function handleToggle() {
    const fd = new FormData();
    fd.set("offerId",   offer.id);
    fd.set("offerName", offer.name);
    fd.set("current",   String(whitelisted));
    start(async () => { await toggleOfferWhitelist(fd); });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset so the same file can be re-selected later
    e.target.value = "";

    setUploading(true);
    setUploadError(false);
    try {
      const body = new FormData();
      body.append("file", file);
      const res  = await fetch("/api/upload", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setUploadError(true);
        setTimeout(() => setUploadError(false), 3000);
        return;
      }

      setLocalImageUrl(data.url);

      const fd = new FormData();
      fd.set("offerId",   offer.id);
      fd.set("offerName", offer.name);
      fd.set("imageUrl",  data.url);
      start(async () => { await updateOfferImage(fd); });
    } catch {
      setUploadError(true);
      setTimeout(() => setUploadError(false), 3000);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-lg px-3 py-2.5 transition-colors sm:flex-row sm:items-center"
      style={{
        border:     `1px solid ${whitelisted ? "rgba(167,139,250,0.25)" : "var(--color-border)"}`,
        background: whitelisted ? "rgba(167,139,250,0.06)" : "var(--color-surface-overlay)",
      }}
    >
      {/* Image + info */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
      {/* Image with upload hover */}
      <div className="group relative shrink-0">
        <div
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg"
          style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-subtle)" }} />
          ) : uploadError ? (
            <AlertCircle className="h-4 w-4" style={{ color: "var(--color-error, #f87171)" }} />
          ) : imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={offer.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg">📦</span>
          )}
        </div>

        {/* Upload overlay — always clickable, appears on hover */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: "rgba(0,0,0,0.65)" }}
          title="Cambiar imagen"
        >
          <Upload className="h-3.5 w-3.5 text-white" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
          {offer.name}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase" style={{ color: "var(--color-subtle)" }}>
            {offer.payout_type}
          </span>
          <span className="text-xs font-semibold tabular-nums" style={{ color: "#a78bfa" }}>
            {offer.payout != null ? `$${offer.payout.toFixed(2)}` : "Rev%"}
          </span>
          <div className="flex items-center gap-0.5">
            {offer.countries.slice(0, 5).map((cc) => (
              <ReactCountryFlag key={cc} countryCode={cc} svg style={{ width: "1em", height: "0.8em", borderRadius: 2 }} />
            ))}
            {offer.countries.length > 5 && (
              <span className="text-[10px]" style={{ color: "var(--color-subtle)" }}>+{offer.countries.length - 5}</span>
            )}
          </div>
          <div className="flex items-center gap-1" style={{ color: "var(--color-subtle)" }}>
            {offer.devices.map((d) =>
              d === "desktop"
                ? <Monitor key={d} className="h-3 w-3" />
                : <Smartphone key={d} className="h-3 w-3" />
            )}
          </div>
        </div>
      </div>
      </div>{/* /Image + info */}

      {/* Controles */}
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">

        {/* Color preset */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1">
            <Palette className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
            <select
              value={colorId ?? ""}
              onChange={(e) => { const v = e.target.value || null; setColorId(v); savePkg({ colorPresetId: v }); }}
              className="rounded-md px-2 py-1 text-xs outline-none max-w-[110px]"
              style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: colorId ? "var(--color-foreground)" : "var(--color-subtle)" }}
            >
              <option value="">Color</option>
              {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Logo preset */}
        {logos.length > 0 && (
          <div className="flex items-center gap-1">
            <ImageIcon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
            <select
              value={logoId ?? ""}
              onChange={(e) => { const v = e.target.value || null; setLogoId(v); savePkg({ logoPresetId: v }); }}
              className="rounded-md px-2 py-1 text-xs outline-none max-w-[110px]"
              style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: logoId ? "var(--color-foreground)" : "var(--color-subtle)" }}
            >
              <option value="">Logo</option>
              {logos.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}

        {/* Dominio */}
        {hosts.length > 0 && (
          <div className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
            <select
              value={domain ?? ""}
              onChange={(e) => { const v = e.target.value || null; setDomain(v); savePkg({ domain: v }); }}
              className="rounded-md px-2 py-1 text-xs outline-none max-w-[130px]"
              style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: domain ? "var(--color-foreground)" : "var(--color-subtle)" }}
            >
              <option value="">Dominio</option>
              {hosts.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        )}

        {/* Stack selector */}
        {stacks.length > 0 && (
          <div className="flex flex-1 items-center gap-1 sm:flex-none">
            <Layers className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
          <select
            value={stackId ?? ""}
            onChange={(e) => {
              const val = e.target.value || null;
              setStackId(val);
              linkStack.mutate({ offerId: offer.id, offerName: offer.name, appStackId: val });
            }}
            className="w-full rounded-md px-2 py-1 text-xs outline-none sm:w-auto sm:max-w-[120px]"
            style={{
              background: "var(--color-surface-raised)",
              border:     "1px solid var(--color-border)",
              color:      stackId ? "var(--color-foreground)" : "var(--color-subtle)",
            }}
          >
            <option value="">Sin stack</option>
            {stacks.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Whitelist toggle */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
        style={{
          background: whitelisted ? "#a78bfa"                  : "var(--color-surface-raised)",
          color:      whitelisted ? "#000"                      : "var(--color-muted-foreground)",
          border:     whitelisted ? "none"                      : "1px solid var(--color-border)",
        }}
      >
        {pending
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : whitelisted
          ? <><Check className="h-3.5 w-3.5" /> Activa</>
          : "Activar"}
      </button>
      </div>{/* /Controles */}
    </div>
  );
}
