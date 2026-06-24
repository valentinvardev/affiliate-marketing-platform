"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

/* ─── Sound: coin drop + register chime ─── */
function playChime() {
  try {
    const ctx = new AudioContext();

    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.type = "sine";
    click.frequency.setValueAtTime(1200, ctx.currentTime);
    click.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
    clickGain.gain.setValueAtTime(0.22, ctx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    click.start(ctx.currentTime);
    click.stop(ctx.currentTime + 0.08);

    [0.06, 0.14].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880 + i * 220, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.22);
    });
  } catch { /* blocked */ }
}

/* ─── Coin stack animation ─── */
function CoinStack() {
  // 3 coins drop in from above and stack up, bottom-to-top with stagger
  return (
    <div className="relative shrink-0" style={{ width: 22, height: 48 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            position:  "absolute",
            left:      0,
            bottom:    i * 13,
            fontSize:  18,
            lineHeight: 1,
            animation: `coinStack 0.35s cubic-bezier(0.22,1,0.36,1) ${i * 0.09}s both`,
          }}
        >
          🪙
        </span>
      ))}
    </div>
  );
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
          borderRadius: 14,
          padding:      "10px 16px 10px 12px",
          boxShadow:    "0 4px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.07)",
          minWidth:     230,
        }}
      >
        <CoinStack />

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
    <>
      <style>{`
        @keyframes coinStack {
          0%   { transform: translateY(-32px); opacity: 0; }
          65%  { transform: translateY(3px);   opacity: 1; }
          100% { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
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
    </>
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
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-opacity active:opacity-60"
      style={{
        background: "rgba(255,255,255,0.07)",
        border:     "1px solid rgba(255,255,255,0.1)",
        color:      "var(--color-muted-foreground)",
      }}
    >
      🪙
    </button>
  );
}

declare global {
  interface Window {
    __triggerConversionToast?: (payload: ConversionPayload) => void;
  }
}
