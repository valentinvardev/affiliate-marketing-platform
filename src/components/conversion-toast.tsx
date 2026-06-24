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

/* ─── Cash register sound (Web Audio API) ─── */
function playChime() {
  try {
    const ctx = new AudioContext();

    // Coin drop: short high click
    const click = ctx.createOscillator();
    const clickGain = ctx.createGain();
    click.connect(clickGain);
    clickGain.connect(ctx.destination);
    click.type = "sine";
    click.frequency.setValueAtTime(1200, ctx.currentTime);
    click.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
    clickGain.gain.setValueAtTime(0.25, ctx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    click.start(ctx.currentTime);
    click.stop(ctx.currentTime + 0.08);

    // Register ding: two ascending tones
    [0.06, 0.14].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880 + i * 220, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.18);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.22);
    });
  } catch {
    // AudioContext not supported or blocked
  }
}

/* ─── Coin particle ─── */
function Coins({ show }: { show: boolean }) {
  const coins = [
    { x: -18, delay: 0,    size: 10 },
    { x:   4, delay: 0.05, size: 8  },
    { x:  16, delay: 0.02, size: 9  },
    { x:  -6, delay: 0.08, size: 7  },
  ];

  if (!show) return null;

  return (
    <div className="pointer-events-none absolute -top-1 right-4 h-10 w-12 overflow-visible">
      {coins.map((c, i) => (
        <span
          key={i}
          className="absolute bottom-0 text-base"
          style={{
            left: `calc(50% + ${c.x}px)`,
            fontSize: c.size,
            animation: `coinFall 0.55s ease-out ${c.delay}s both`,
          }}
        >
          🪙
        </span>
      ))}
    </div>
  );
}

/* ─── Single toast ─── */
function ConversionCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (uid: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [showCoins, setShowCoins] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    setShowCoins(true);
    const t = setTimeout(() => setShowCoins(false), 800);
    const d = setTimeout(() => { setVisible(false); setTimeout(() => onDismiss(toast.uid), 350); }, 5000);
    return () => { clearTimeout(t); clearTimeout(d); };
  }, [toast.uid, onDismiss]);

  return (
    <div
      className="relative overflow-visible"
      style={{
        transform:  visible ? "translateY(0) scale(1)"   : "translateY(16px) scale(0.96)",
        opacity:    visible ? 1                           : 0,
        transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
      }}
    >
      <Coins show={showCoins} />
      <div
        className="flex items-center gap-3 rounded-xl px-4 py-3"
        style={{
          background:   "rgba(18,18,22,0.96)",
          border:       "1px solid rgba(167,139,250,0.25)",
          boxShadow:    "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.08) inset",
          backdropFilter: "blur(16px)",
          minWidth:     240,
        }}
      >
        {/* Pulsing dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ background: "#a78bfa" }}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#a78bfa" }} />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold" style={{ color: "var(--color-foreground, #f5f5f5)" }}>
              Nueva conversión
            </p>
            {toast.country && (
              <ReactCountryFlag
                countryCode={toast.country}
                svg
                style={{ width: "1em", height: "0.78em", borderRadius: 2 }}
              />
            )}
          </div>
          {toast.offerName && (
            <p className="mt-0.5 truncate text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
              {toast.offerName}
            </p>
          )}
        </div>

        <p
          className="shrink-0 text-sm font-bold tabular-nums"
          style={{ color: "#a78bfa" }}
        >
          +${toast.price.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

/* ─── Provider ─── */
export function ConversionToastProvider() {
  const [toasts, setToasts]     = useState<Toast[]>([]);
  const lastSeenRef             = useRef<string>(new Date().toISOString());
  const dismiss = useCallback((uid: string) => setToasts(t => t.filter(x => x.uid !== uid)), []);

  // Expose a global trigger for the test button
  useEffect(() => {
    window.__triggerConversionToast = (payload: ConversionPayload) => {
      playChime();
      setToasts(t => [...t, { ...payload, uid: Math.random().toString(36).slice(2) }]);
    };
    return () => { delete window.__triggerConversionToast; };
  }, []);

  // Poll for new conversions every 8 seconds
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
      } catch { /* network error, skip */ }
      if (active) setTimeout(poll, 8000);
    }
    const t = setTimeout(poll, 8000);
    return () => { active = false; clearTimeout(t); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes coinFall {
          0%   { transform: translateY(0)    scale(1);    opacity: 1; }
          60%  { transform: translateY(-28px) scale(1.1); opacity: 1; }
          100% { transform: translateY(-8px)  scale(0.8); opacity: 0; }
        }
      `}</style>
      <div
        className="fixed right-5 top-5 z-[9999] flex flex-col gap-2"
        style={{ pointerEvents: "none" }}
      >
        {toasts.map((t) => (
          <ConversionCard key={t.uid} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </>
  );
}

/* ─── Test trigger button ─── */
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
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity active:opacity-70"
      style={{
        background: "rgba(167,139,250,0.1)",
        border:     "1px solid rgba(167,139,250,0.2)",
        color:      "#a78bfa",
      }}
    >
      🪙 Test
    </button>
  );
}

/* ─── Global type augmentation ─── */
declare global {
  interface Window {
    __triggerConversionToast?: (payload: ConversionPayload) => void;
  }
}
