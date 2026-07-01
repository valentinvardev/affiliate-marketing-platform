"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import ReactCountryFlag from "react-country-flag";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import {
  Network, Plus, Copy, Check, Loader2, Trash2, RefreshCw, KeyRound, AlertTriangle, Server,
} from "lucide-react";

export function ProxiesManager() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const utils = api.useUtils();
  const mineQ = api.proxies.mine.useQuery();
  const claim = api.proxies.claim.useMutation({
    onSuccess: () => { void utils.proxies.mine.invalidate(); void utils.proxies.stats.invalidate(); },
    onError: (e) => alert(e.message),
  });

  const mine = mineQ.data;
  const held = mine?.items.length ?? 0;
  const max = mine?.max ?? 0;
  const available = mine?.available ?? 0;
  const atLimit = held >= max;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Network className="h-4 w-4" style={{ color: "var(--color-foreground)" }} />
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Proxies</h1>
        <span className="ml-2 text-[11px]" style={{ color: "var(--color-subtle)" }}>ISP · IPRoyal</span>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 md:px-8">
        {isAdmin && <AdminPanel />}

        {/* Reclamar */}
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Tenés {held} de {max} proxies</p>
            <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
              {available} disponible{available === 1 ? "" : "s"} en el pool
            </p>
          </div>
          <button type="button" disabled={claim.isPending || atLimit || available === 0} onClick={() => claim.mutate()}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
            {claim.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Reclamar proxy
          </button>
          {atLimit && <p className="w-full text-[11px]" style={{ color: "var(--color-warning)" }}>Llegaste a tu límite. Soltá uno para tomar otro.</p>}
          {available === 0 && !atLimit && <p className="w-full text-[11px]" style={{ color: "var(--color-subtle)" }}>No hay proxies libres ahora. {isAdmin ? "Sincronizá desde IPRoyal." : "Pedile al admin que sincronice."}</p>}
        </div>

        {/* Mis proxies */}
        {mineQ.isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
        ) : held === 0 ? (
          <div className="rounded-xl py-14 text-center" style={{ border: "1px dashed var(--color-border)" }}>
            <Server className="mx-auto h-6 w-6" style={{ color: "var(--color-subtle)" }} />
            <p className="mt-3 text-sm" style={{ color: "var(--color-muted-foreground)" }}>Todavía no tenés proxies</p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-subtle)" }}>Reclamá uno del pool arriba.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mine!.items.map((p) => <ProxyCard key={p.id} p={p} />)}
          </div>
        )}
      </main>
    </div>
  );
}

type MineItem = RouterOutputs["proxies"]["mine"]["items"][number];

function ProxyCard({ p }: { p: MineItem }) {
  const utils = api.useUtils();
  const release = api.proxies.release.useMutation({ onSuccess: () => { void utils.proxies.mine.invalidate(); void utils.proxies.stats.invalidate(); } });
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
        {p.country && <ReactCountryFlag countryCode={p.country} svg style={{ width: "1.15em", height: "0.85em", borderRadius: 2 }} />}
        <span className="font-mono text-sm" style={{ color: "var(--color-foreground)" }}>{p.host}</span>
        {p.label && <span className="truncate text-[11px]" style={{ color: "var(--color-subtle)" }}>· {p.label}</span>}
        <button type="button" title="Soltar" disabled={release.isPending}
          onClick={() => { if (confirm("¿Soltar este proxy? Vuelve al pool.")) release.mutate({ proxyId: p.id }); }}
          className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:opacity-70" style={{ color: "var(--color-muted-foreground)" }}>
          {release.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="space-y-2 p-3">
        <CopyRow label="HTTP" value={p.http} />
        {p.socks && <CopyRow label="SOCKS5" value={p.socks} />}
        {p.expiresAt && <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>Vence: {new Date(p.expiresAt).toLocaleDateString("es")}</p>}
      </div>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-subtle)" }}>{label}</span>
      <span className="min-w-0 flex-1 truncate font-mono text-[11px]" style={{ color: "var(--color-foreground)" }}>{value}</span>
      <button type="button" title="Copiar" onClick={() => { navigator.clipboard.writeText(value).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        style={{ color: copied ? "var(--color-success)" : "var(--color-muted-foreground)" }}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

/* ── Admin ── */
function AdminPanel() {
  const utils = api.useUtils();
  const statsQ = api.proxies.stats.useQuery();
  const sync = api.proxies.sync.useMutation({ onSuccess: (r) => { setSyncMsg(`+${r.added} nuevos · ${r.updated} actualizados`); void utils.proxies.stats.invalidate(); void utils.proxies.mine.invalidate(); }, onError: (e) => setSyncMsg(e.message) });
  const setToken = api.proxies.setToken.useMutation({ onSuccess: () => { setTokenVal(""); void utils.proxies.stats.invalidate(); } });
  const setLimit = api.proxies.setLimit.useMutation({ onSuccess: () => { setSavedLimit(true); setTimeout(() => setSavedLimit(false), 1500); void utils.proxies.mine.invalidate(); } });

  const [tokenVal, setTokenVal] = useState("");
  const [limitVal, setLimitVal] = useState("2");
  const [savedLimit, setSavedLimit] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const s = statsQ.data;

  return (
    <div className="mb-6 rounded-xl p-4" style={{ border: "1px solid var(--color-border-focus)", background: "linear-gradient(180deg, var(--color-surface-overlay), transparent)" }}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-subtle)" }}>Pool · admin</p>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="Disponibles" value={s?.available ?? 0} color="var(--color-success)" />
        <Stat label="Reclamados" value={s?.claimed ?? 0} color="var(--color-warning)" />
        <Stat label="Total" value={s?.total ?? 0} color="var(--color-foreground)" />
      </div>

      {/* Token */}
      <div className="mb-3">
        <label className="text-[11px] font-medium" style={{ color: "var(--color-muted-foreground)" }}>
          Token de IPRoyal <span style={{ color: s?.hasToken ? "var(--color-success)" : "var(--color-warning)" }}>{s?.hasToken ? "· configurado" : "· sin configurar"}</span>
        </label>
        <div className="mt-1 flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-md" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
            <KeyRound className="ml-3 h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
            <input value={tokenVal} onChange={(e) => setTokenVal(e.target.value)} type="password" placeholder="X-Access-Token"
              className="flex-1 bg-transparent px-2.5 py-2 text-sm outline-none" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }} />
          </div>
          <button type="button" disabled={!tokenVal.trim() || setToken.isPending} onClick={() => setToken.mutate({ token: tokenVal })}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
            {setToken.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Guardar
          </button>
        </div>
      </div>

      {/* Límite + Sync */}
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="text-[11px] font-medium" style={{ color: "var(--color-muted-foreground)" }}>Proxies por usuario</label>
          <div className="mt-1 flex items-center gap-2">
            <input value={limitVal} onChange={(e) => setLimitVal(e.target.value)} type="number" min={1} max={100}
              className="w-20 rounded-md px-3 py-2 text-sm tabular-nums outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
            <button type="button" disabled={setLimit.isPending || !(parseInt(limitVal, 10) >= 1)} onClick={() => setLimit.mutate({ maxProxies: parseInt(limitVal, 10) })}
              className="rounded-md px-3 py-2 text-xs font-medium" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
              {savedLimit ? "✓" : "Guardar"}
            </button>
          </div>
        </div>
        <button type="button" disabled={sync.isPending} onClick={() => { setSyncMsg(null); sync.mutate(); }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
          {sync.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Sincronizar
        </button>
      </div>
      {syncMsg && <p className="mt-2 inline-flex items-center gap-1.5 text-xs" style={{ color: sync.isError ? "var(--color-error)" : "var(--color-success)" }}>
        {sync.isError && <AlertTriangle className="h-3.5 w-3.5" />}{syncMsg}
      </p>}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg p-3 text-center" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
      <p className="text-xl font-bold tabular-nums" style={{ fontFamily: "var(--font-brand)", color }}>{value}</p>
      <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>{label}</p>
    </div>
  );
}
