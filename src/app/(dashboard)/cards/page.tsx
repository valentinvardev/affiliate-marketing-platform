"use client";

import { useState } from "react";
import {
  CreditCard, Plus, Loader2, RefreshCw, Eye, EyeOff, ArrowUpCircle,
  AlertTriangle, Link as LinkIcon, X, Check, Copy, Plug,
} from "lucide-react";
import { api } from "@/trpc/react";

/* Shape real de /api/suite/vcc */
type VCC = {
  id: string;
  slashCardId?: string;
  cardName?: string;
  cardNumber?: string;
  last4?: string;
  cvv?: string;
  expiryMonth?: string;
  expiryYear?: string;
  spendLimit?: number;
  currentSpend?: number;
  status?: string;
  isPaused?: boolean;
  transactionCount?: number;
  [k: string]: unknown;
};

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

async function suite(path: string, init?: RequestInit) {
  const res = await fetch(`/api/suite/${path}`, init);
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

/* ── Tarjeta visual (firma) ── */
function CardVisual({ card, revealed }: { card?: VCC; revealed?: boolean }) {
  const name = card?.cardName ?? "Nueva tarjeta";
  const last4 = card?.last4 ?? card?.cardNumber?.slice(-4) ?? "0000";
  const full = card?.cardNumber ? card.cardNumber.replace(/(.{4})/g, "$1 ").trim() : "";
  const number = revealed && full ? full : `•••• •••• •••• ${last4}`;
  const exp = card?.expiryMonth ? `${card.expiryMonth}/${String(card.expiryYear ?? "").slice(-2)}` : "••/••";
  const cvv = revealed ? (card?.cvv ?? "•••") : "•••";

  return (
    <div
      className="relative flex aspect-[1.586/1] w-full flex-col justify-between overflow-hidden rounded-2xl p-5"
      style={{
        background: "linear-gradient(135deg, #1c1c1c 0%, #0c0c0c 60%, #050505 100%)",
        border: "1px solid var(--color-border)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
      }}
    >
      {/* sheen */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.06) 0%, transparent 40%)" }} />

      <div className="relative flex items-start justify-between">
        <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 16, color: "#fff" }}>TapSur</span>
        <span className="text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-subtle)" }}>Virtual · Slash</span>
      </div>

      {/* chip */}
      <div className="relative mt-1 h-7 w-10 rounded-md" style={{ background: "linear-gradient(135deg, #caa15a, #8c6a2f)" }} />

      <div className="relative">
        <p className="tabular-nums" style={{ fontFamily: "var(--font-mono)", fontSize: 17, letterSpacing: 2, color: "#ededed" }}>
          {number}
        </p>
        <div className="mt-2 flex items-end justify-between">
          <span className="truncate text-xs uppercase tracking-wide" style={{ color: "var(--color-muted-foreground)" }}>{name}</span>
          <span className="text-[11px] tabular-nums" style={{ fontFamily: "var(--font-mono)", color: "var(--color-muted-foreground)" }}>
            {exp} · CVV {cvv}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CardsPage() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [busy, setBusy]     = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", limit: "", bin: "", campaign: "" });

  // Conexión de sesión (cookie guardada en DB)
  const [cookieInput, setCookieInput] = useState("");
  const [forceReconnect, setForceReconnect] = useState(false);
  const setCookie = api.config.setSuiteCookie.useMutation();

  // Lista scopeada por rol/usuario (tRPC)
  const cardsQuery = api.cards.list.useQuery(undefined, { retry: false });
  const cards     = (cardsQuery.data?.cards ?? []) as unknown as VCC[];
  const loading   = cardsQuery.isLoading;
  const connected = (cardsQuery.data?.connected ?? true) && !forceReconnect;
  const error     = cardsQuery.isError ? (cardsQuery.error?.message ?? "Error") : null;

  const load = () => cardsQuery.refetch();

  const createMut = api.cards.create.useMutation({
    onSuccess: () => { setForm({ name: "", limit: "", bin: "", campaign: "" }); setCreating(false); void cardsQuery.refetch(); },
    onError:   (e) => alert(e.message),
  });
  const submitting = createMut.isPending;

  function createCard(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.limit) return;
    createMut.mutate({
      cardName:   form.name.trim(),
      spendLimit: parseFloat(form.limit),
      ...(form.bin ? { bin: form.bin } : {}),
      ...(form.campaign ? { campaignId: form.campaign } : {}),
    });
  }

  async function increaseLimit(id: string) {
    const v = prompt("Nuevo límite (USD):");
    if (!v) return;
    setBusy(id);
    await suite(`vcc/${id}/increase-limit`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ spendLimit: parseFloat(v) }),
    });
    setBusy(null);
    void cardsQuery.refetch();
  }

  async function syncSpend(id: string) {
    setBusy(id);
    await suite(`vcc/${id}/sync-spend`, { method: "POST" });
    setBusy(null);
    void cardsQuery.refetch();
  }

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    if (!cookieInput.trim()) return;
    await setCookie.mutateAsync({ value: cookieInput.trim() });
    setCookieInput("");
    setForceReconnect(false);
    void cardsQuery.refetch();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="flex h-14 shrink-0 items-center justify-between gap-2 px-4 md:px-8"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
          <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Tarjetas virtuales</h1>
        </div>
        {connected && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setForceReconnect(true)}
              className="hidden text-[11px] transition-opacity hover:opacity-70 sm:inline"
              style={{ color: "var(--color-subtle)" }}
              title="Actualizar cookie de sesión"
            >
              Reconectar
            </button>
            <button
              type="button"
              onClick={load}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}
              title="Refrescar"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
            >
              <Plus className="h-3.5 w-3.5" /> Nueva tarjeta
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-4xl">

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-subtle)" }} />
            </div>
          )}

          {/* Not connected → pegar cookie de sesión */}
          {!loading && !connected && (
            <div className="mx-auto max-w-md">
              <div className="mx-auto max-w-xs">
                <CardVisual />
              </div>
              <h2 className="mt-6 text-center text-lg font-bold" style={{ color: "var(--color-foreground)" }}>Conectá tu sesión de TapRain</h2>
              <p className="mt-2 text-center text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
                La Ads Suite usa sesión (no API key). Pegá la cookie de sesión de tu cuenta de TapRain.
              </p>
              <form onSubmit={connect} className="mt-5">
                <textarea
                  value={cookieInput}
                  onChange={(e) => setCookieInput(e.target.value)}
                  rows={3}
                  placeholder="cookie de sesión (DevTools → Application → Cookies)…"
                  className="w-full resize-none rounded-md px-3 py-2 text-xs outline-none"
                  style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}
                />
                <button
                  type="submit"
                  disabled={!cookieInput.trim() || setCookie.isPending}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md py-2.5 text-sm font-semibold disabled:opacity-40"
                  style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
                >
                  {setCookie.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plug className="h-3.5 w-3.5" />}
                  Conectar
                </button>
              </form>
              <details className="mt-4 text-xs" style={{ color: "var(--color-subtle)" }}>
                <summary className="cursor-pointer select-none">¿Cómo obtengo la cookie?</summary>
                <ol className="mt-2 list-decimal space-y-1 pl-4 leading-relaxed">
                  <li>Logueate en taprain.com en el navegador.</li>
                  <li>DevTools (F12) → pestaña <span className="font-mono">Application</span> → <span className="font-mono">Cookies</span> → taprain.com.</li>
                  <li>Copiá el/los valores de sesión como <span className="font-mono">nombre=valor; nombre2=valor2</span>.</li>
                  <li>Pegalos arriba y Conectar. Si expira, repetí el paso.</li>
                </ol>
              </details>
            </div>
          )}

          {/* Error */}
          {!loading && connected && error && (
            <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: "var(--color-error-bg)", border: "1px solid color-mix(in oklch, var(--color-error) 25%, transparent)" }}>
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--color-error)" }} />
              <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>
            </div>
          )}

          {/* Cards grid */}
          {!loading && connected && !error && (
            cards.length === 0 ? (
              <div className="rounded-2xl py-16 text-center" style={{ border: "1px dashed var(--color-border)" }}>
                <CreditCard className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--color-subtle)" }} />
                <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Sin tarjetas todavía.</p>
                <button type="button" onClick={() => setCreating(true)} className="mt-4 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
                  <Plus className="h-3.5 w-3.5" /> Crear la primera
                </button>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {cards.map((c) => {
                  const limit = c.spendLimit ?? 0;
                  const spent = c.currentSpend ?? 0;
                  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
                  const isOpen = revealed[c.id];
                  return (
                    <div key={c.id} className="flex flex-col gap-3">
                      <CardVisual card={c} revealed={isOpen} />
                      {/* meta + actions */}
                      <div className="rounded-xl p-3" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: "var(--color-muted-foreground)" }}>
                            <span className="font-semibold tabular-nums" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}>{usd(spent)}</span> / {usd(limit)}
                          </span>
                          {c.status && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)" }}>
                              {c.status}
                            </span>
                          )}
                        </div>
                        {/* progress */}
                        <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: "var(--color-surface-overlay)" }}>
                          <div className="h-full" style={{ width: `${pct}%`, background: pct > 85 ? "var(--color-error)" : "var(--color-foreground)" }} />
                        </div>
                        {/* actions */}
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <ActionBtn onClick={() => setRevealed((r) => ({ ...r, [c.id]: !r[c.id] }))}>
                            {isOpen ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {isOpen ? "Ocultar" : "Revelar"}
                          </ActionBtn>
                          {isOpen && c.cardNumber && (
                            <ActionBtn onClick={() => void navigator.clipboard.writeText(c.cardNumber!)}>
                              <Copy className="h-3 w-3" /> Copiar
                            </ActionBtn>
                          )}
                          <ActionBtn onClick={() => increaseLimit(c.id)} disabled={busy === c.id}>
                            <ArrowUpCircle className="h-3 w-3" /> Límite
                          </ActionBtn>
                          <ActionBtn onClick={() => syncSpend(c.id)} disabled={busy === c.id}>
                            {busy === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Sync
                          </ActionBtn>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>

      {/* Modal crear */}
      {creating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setCreating(false); }}
        >
          <form
            onSubmit={createCard}
            className="w-full max-w-sm rounded-2xl p-5"
            style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Nueva tarjeta</p>
              <button type="button" onClick={() => setCreating(false)} style={{ color: "var(--color-subtle)" }}><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Nombre">
                <Input value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} placeholder="tiktok-us-shein" required />
              </Field>
              <Field label="Límite de spend (USD)">
                <Input value={form.limit} onChange={(v) => setForm((f) => ({ ...f, limit: v }))} placeholder="100" type="number" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="BIN (opcional)">
                  <Input value={form.bin} onChange={(v) => setForm((f) => ({ ...f, bin: v }))} placeholder="auto" />
                </Field>
                <Field label="Campaña (opcional)">
                  <Input value={form.campaign} onChange={(v) => setForm((f) => ({ ...f, campaign: v }))} placeholder="id / nombre" icon={<LinkIcon className="h-3 w-3" />} />
                </Field>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || !form.name.trim() || !form.limit}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-md py-2.5 text-sm font-semibold disabled:opacity-40"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Crear tarjeta
            </button>
            <p className="mt-2 text-center text-[11px]" style={{ color: "var(--color-subtle)" }}>
              Se descuenta de tu credit line.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
      style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>
      {children}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text", required, icon,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md px-3 py-2" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
      {icon && <span style={{ color: "var(--color-subtle)" }}>{icon}</span>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
        className="w-full bg-transparent text-sm outline-none"
        style={{ color: "var(--color-foreground)" }}
      />
    </div>
  );
}
