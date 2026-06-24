"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Eye, EyeOff, MessageCircle, DollarSign } from "lucide-react";

type BalanceData = {
  today:     { revenue: number; conversions: number };
  yesterday: { revenue: number; conversions: number };
};

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", minimumFractionDigits: 2,
});

const HIDE_KEY = "aff_hide_balance";

export function BalanceBar() {
  const [data, setData]       = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden]   = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/stats/balance");
      if (res.ok) setData(await res.json() as BalanceData);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try { setHidden(localStorage.getItem(HIDE_KEY) === "1"); } catch {}
  }, []);

  useEffect(() => {
    function onMouse(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener("mousedown", onMouse);
    return () => document.removeEventListener("mousedown", onMouse);
  }, [notifOpen]);

  function toggleHidden() {
    setHidden((h) => {
      const next = !h;
      try { localStorage.setItem(HIDE_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  }

  const balance = data?.today.revenue ?? 0;

  return (
    <div
      className="flex shrink-0 items-center gap-2 px-6"
      style={{
        height:       48,
        borderBottom: "1px solid var(--color-border)",
        background:   "var(--color-surface)",
      }}
    >
      <div className="flex-1" />

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button
          type="button"
          title="Notificaciones"
          onClick={() => setNotifOpen((o) => !o)}
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
          style={{
            background: notifOpen ? "var(--color-surface-overlay)" : "transparent",
            border:     "1px solid var(--color-border)",
            color:      "var(--color-muted-foreground)",
          }}
        >
          <Bell className="h-3.5 w-3.5" />
        </button>

        {/* Popover */}
        {notifOpen && (
          <div
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-lg"
            style={{
              background: "var(--color-surface-raised)",
              border:     "1px solid var(--color-border)",
              boxShadow:  "0 12px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div
              className="px-3 py-2.5"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <span className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>
                Notificaciones
              </span>
            </div>
            <div className="px-4 py-7 text-center">
              <p className="text-xs" style={{ color: "var(--color-subtle)" }}>
                Sin notificaciones nuevas.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Wallet */}
      <div
        className="flex items-center gap-1.5 rounded-md px-2.5"
        style={{
          height:     28,
          background: "transparent",
          border:     "1px solid var(--color-border)",
        }}
      >
        <DollarSign className="h-3 w-3" style={{ color: "var(--color-subtle)" }} />
        <span className="text-xs font-medium tabular-nums" style={{ color: "var(--color-foreground)" }}>
          {loading ? "—" : hidden ? "••••••" : fmt.format(balance)}
        </span>
        <button
          type="button"
          title={hidden ? "Mostrar balance" : "Ocultar balance"}
          onClick={toggleHidden}
          className="flex items-center transition-opacity hover:opacity-70"
          style={{ color: "var(--color-subtle)" }}
        >
          {hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>
      </div>

      {/* Live Chat */}
      <button
        type="button"
        title="Chat en vivo"
        onClick={() => window.dispatchEvent(new CustomEvent("chat:open"))}
        className="flex items-center gap-1.5 rounded-md px-2.5 transition-colors hover:opacity-80"
        style={{
          height:     28,
          background: "transparent",
          border:     "1px solid var(--color-border)",
          color:      "var(--color-muted-foreground)",
        }}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Chat</span>
      </button>
    </div>
  );
}
