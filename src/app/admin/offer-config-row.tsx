"use client";

import { useTransition, useRef, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { Check, Upload, Loader2, Monitor, Smartphone } from "lucide-react";
import { toggleOfferWhitelist, updateOfferImage } from "./actions";
import type { Offer } from "@/lib/taprain";

type Config = { whitelisted: boolean; imageUrl: string | null } | null;

export function OfferConfigRow({ offer, config }: { offer: Offer; config: Config }) {
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(config?.imageUrl ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const whitelisted = config?.whitelisted ?? false;
  const imageUrl = localImageUrl ?? offer.image_url;

  function handleToggle() {
    const fd = new FormData();
    fd.set("offerId",   offer.id);
    fd.set("offerName", offer.name);
    fd.set("current",   String(whitelisted));
    start(() => toggleOfferWhitelist(fd));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        setLocalImageUrl(data.url);
        const fd = new FormData();
        fd.set("offerId",   offer.id);
        fd.set("offerName", offer.name);
        fd.set("imageUrl",  data.url);
        start(() => updateOfferImage(fd));
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
      style={{
        border: `1px solid ${whitelisted ? "rgba(167,139,250,0.25)" : "var(--color-border)"}`,
        background: whitelisted ? "rgba(167,139,250,0.06)" : "var(--color-surface-overlay)",
      }}
    >
      {/* Image with upload hover */}
      <div className="group relative shrink-0">
        <div
          className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg"
          style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-subtle)" }} />
          ) : imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={offer.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg">📦</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: "rgba(0,0,0,0.65)" }}
          title="Cambiar imagen"
        >
          <Upload className="h-3.5 w-3.5 text-white" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
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

      {/* Whitelist toggle */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50"
        style={{
          background:   whitelisted ? "#a78bfa" : "var(--color-surface-raised)",
          color:        whitelisted ? "#000"     : "var(--color-muted-foreground)",
          border:       whitelisted ? "none"     : "1px solid var(--color-border)",
        }}
      >
        {pending
          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
          : whitelisted
          ? <><Check className="h-3.5 w-3.5" /> Activa</>
          : "Activar"}
      </button>
    </div>
  );
}
