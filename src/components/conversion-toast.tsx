"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CircleDollarSign, Coins } from "lucide-react";
import ReactCountryFlag from "react-country-flag";

/* ─── Types ─── */
type ConversionPayload = {
  id: string;
  price: number;
  offerName: string | null;
  country: string | null;
  receivedAt: string;
};

type Toast = ConversionPayload & { uid: string };

/* ─── Sound: "cha-ching" (archivo en /public) ─── */
let chimeAudio: HTMLAudioElement | null = null;
function playChime() {
  try {
    chimeAudio ??= Object.assign(new Audio("/cha-ching.mp3"), { volume: 0.6 });
    chimeAudio.currentTime = 0;
    void chimeAudio.play().catch(() => { /* autoplay bloqueado hasta la 1ra interacción */ });
  } catch { /* sin Audio */ }
}

/* ─── Icon ─── */
function ConversionIcon() {
  return <CircleDollarSign style={{ width: 22, height: 22, color: "#111", flexShrink: 0 }} />;
}

/* ─── Single toast card ─── */
function ConversionCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (uid: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const d = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.uid), 320);
    }, 5000);
    return () => clearTimeout(d);
  }, [toast.uid, onDismiss]);

  return (
    <div
      style={{
        transform:  visible ? "translateY(0) scale(1)"    : "translateY(12px) scale(0.97)",
        opacity:    visible ? 1                            : 0,
        transition: "transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease",
      }}
    >
      <div
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          12,
          background:   "#ffffff",
          borderRadius: 0,
          padding:      "10px 16px 10px 12px",
          boxShadow:    "0 8px 30px rgba(0,0,0,0.14)",
          minWidth:     230,
        }}
      >
        <ConversionIcon />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#111", lineHeight: 1.3 }}>
            Nueva conversión
          </p>
          {toast.offerName && (
            <p style={{ fontSize: 11, color: "#888", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {toast.offerName}
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
          {toast.country && (
            <ReactCountryFlag
              countryCode={toast.country}
              svg
              style={{ width: "1.1em", height: "0.85em", borderRadius: 2 }}
            />
          )}
          <p style={{ fontSize: 13, fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>
            +${toast.price.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Provider ─── */
export function ConversionToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastSeenRef         = useRef<string>(new Date().toISOString());
  const dismiss = useCallback((uid: string) => setToasts(t => t.filter(x => x.uid !== uid)), []);

  useEffect(() => {
    window.__triggerConversionToast = (payload: ConversionPayload) => {
      playChime();
      setToasts(t => [...t, { ...payload, uid: Math.random().toString(36).slice(2) }]);
    };
    return () => { delete window.__triggerConversionToast; };
  }, []);

  useEffect(() => {
    let active = true;
    async function poll() {
      if (!active) return;
      try {
        const res = await fetch(`/api/conversions/stream?since=${encodeURIComponent(lastSeenRef.current)}`);
        if (res.ok) {
          const data = (await res.json()) as { conversion: ConversionPayload | null };
          if (data.conversion) {
            lastSeenRef.current = data.conversion.receivedAt;
            window.__triggerConversionToast?.(data.conversion);
          }
        }
      } catch { /* skip */ }
      if (active) setTimeout(poll, 8000);
    }
    const t = setTimeout(poll, 8000);
    return () => { active = false; clearTimeout(t); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position:       "fixed",
        right:          20,
        top:            20,
        zIndex:         9999,
        display:        "flex",
        flexDirection:  "column",
        gap:            8,
        pointerEvents:  "none",
      }}
    >
      {toasts.map((t) => (
        <ConversionCard key={t.uid} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}

/* ─── Test button ─── */
export function ConversionTestButton() {
  return (
    <button
      type="button"
      onClick={() => {
        window.__triggerConversionToast?.({
          id:         "test",
          price:      Math.round((Math.random() * 4.5 + 0.5) * 100) / 100,
          offerName:  "Test Offer",
          country:    ["US", "GB", "DE", "BR", "AR"][Math.floor(Math.random() * 5)] ?? "US",
          receivedAt: new Date().toISOString(),
        });
      }}
      title="Generar lead de ejemplo"
      className="inline-flex items-center justify-center rounded-lg p-1.5 transition-opacity active:opacity-60"
      style={{
        background: "rgba(255,255,255,0.07)",
        border:     "1px solid rgba(255,255,255,0.1)",
        color:      "var(--color-muted-foreground)",
      }}
    >
      <Coins className="h-3.5 w-3.5" />
    </button>
  );
}

declare global {
  interface Window {
    __triggerConversionToast?: (payload: ConversionPayload) => void;
  }
}
