"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import {
  Shuffle, Globe, Plus, Trash2, Loader2, Check, ExternalLink, Search, X, Target, ListPlus, AlertTriangle,
} from "lucide-react";
import type { RouterOutputs } from "@/trpc/react";

type Redirect = RouterOutputs["redirects"]["list"][number];

export function RedirectsManager() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const utils = api.useUtils();
  const domainsQ = api.redirects.domains.useQuery();
  const listQ = api.redirects.list.useQuery();

  const create = api.redirects.create.useMutation({
    onSuccess: () => { setPath(""); void utils.redirects.list.invalidate(); },
    onError: (e) => setErr(e.message),
  });

  const domains = domainsQ.data ?? [];
  const items = listQ.data ?? [];

  const [domain, setDomain] = useState("");
  const [path, setPath] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // dominio por defecto cuando cargan
  useEffect(() => { if (!domain && domains[0]) setDomain(domains[0].domain); }, [domains, domain]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Redirecciones</h1>
        <span className="ml-2.5 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums"
          style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>
          {items.length}
        </span>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 md:px-8">
        <p className="mb-5 text-xs leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
          Cada redirector vive en un <strong>dominio/ruta</strong> (ej. <span className="font-mono" style={{ color: "var(--color-foreground)" }}>dealdrop.lat/1</span>)
          con un switch: <strong>cloaking</strong> prendido rota una lista de páginas; apagado manda a la landing de una campaña.
        </p>

        {/* Dominios (solo admin) */}
        {isAdmin && <DomainsAdmin />}

        {/* Nuevo redirector */}
        <div className="mb-6 rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-subtle)" }}>Nuevo redirector</p>
          {domains.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              {isAdmin ? "Agregá un dominio arriba para empezar." : "Todavía no hay dominios. Pedile al admin que agregue uno."}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center rounded-md" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
                  <select value={domain} onChange={(e) => setDomain(e.target.value)}
                    className="bg-transparent py-2 pl-3 pr-2 text-sm outline-none" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}>
                    {domains.map((d) => <option key={d.id} value={d.domain} style={{ background: "var(--color-surface-raised)" }}>{d.domain}</option>)}
                  </select>
                  <span className="text-sm" style={{ color: "var(--color-subtle)" }}>/</span>
                  <input value={path} onChange={(e) => { setPath(e.target.value); setErr(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && domain) create.mutate({ domain, path }); }}
                    placeholder="1, caca, pis…"
                    className="w-32 bg-transparent py-2 pl-1 pr-3 text-sm outline-none" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }} />
                </div>
                <button type="button" disabled={!domain || create.isPending} onClick={() => create.mutate({ domain, path })}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
                  style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
                  {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Crear
                </button>
              </div>
              {err && <p className="mt-2 inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-error)" }}><AlertTriangle className="h-3.5 w-3.5" /> {err}</p>}
            </>
          )}
        </div>

        {/* Lista de redirectores */}
        {listQ.isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
        ) : items.length === 0 ? (
          <div className="rounded-xl py-16 text-center" style={{ border: "1px dashed var(--color-border)" }}>
            <Shuffle className="mx-auto h-6 w-6" style={{ color: "var(--color-subtle)" }} />
            <p className="mt-3 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Sin redirectores</p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Creá uno arriba eligiendo dominio y ruta.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((r) => <RedirectCard key={r.id} redirect={r} />)}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Admin: dominios disponibles ── */
function DomainsAdmin() {
  const utils = api.useUtils();
  const domainsQ = api.redirects.domains.useQuery();
  const add = api.redirects.addDomain.useMutation({ onSuccess: () => { setVal(""); void utils.redirects.domains.invalidate(); }, onError: (e) => setErr(e.message) });
  const remove = api.redirects.removeDomain.useMutation({ onSuccess: () => { void utils.redirects.domains.invalidate(); void utils.redirects.list.invalidate(); } });
  const [val, setVal] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const domains = domainsQ.data ?? [];

  return (
    <div className="mb-6 rounded-xl p-4" style={{ border: "1px solid var(--color-border-focus)", background: "linear-gradient(180deg, var(--color-surface-overlay), transparent)" }}>
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-subtle)" }}>Dominios disponibles · admin</p>
      {domains.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {domains.map((d) => (
            <span key={d.id} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono"
              style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
              {d.domain}
              <button type="button" title="Eliminar dominio y sus redirectores"
                onClick={() => { if (confirm(`¿Eliminar ${d.domain} y todos sus redirectores?`)) remove.mutate({ id: d.id }); }}
                style={{ color: "var(--color-subtle)" }}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-md" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
          <Globe className="ml-3 h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
          <input value={val} onChange={(e) => { setVal(e.target.value); setErr(null); }}
            onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) add.mutate({ domain: val }); }}
            placeholder="dealdrop.lat"
            className="flex-1 bg-transparent px-2.5 py-2 text-sm outline-none" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }} />
        </div>
        <button type="button" disabled={!val.trim() || add.isPending} onClick={() => add.mutate({ domain: val })}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
          {add.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Agregar dominio
        </button>
      </div>
      {err && <p className="mt-2 inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-error)" }}><AlertTriangle className="h-3.5 w-3.5" /> {err}</p>}
    </div>
  );
}

function RedirectCard({ redirect: r }: { redirect: Redirect }) {
  const utils = api.useUtils();
  const refresh = () => void utils.redirects.list.invalidate();
  const setCloak = api.redirects.setCloak.useMutation({ onMutate: () => setCloakOn((v) => !v), onSettled: refresh });
  const save = api.redirects.save.useMutation({ onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 1800); refresh(); } });
  const remove = api.redirects.remove.useMutation({ onSuccess: refresh });

  const [cloakOn, setCloakOn] = useState(r.cloakOn);
  const [pages, setPages] = useState((r.whitepages ?? []).join("\n"));
  const [targetUrl, setTargetUrl] = useState(r.targetUrl ?? "");
  const [campaignId, setCampaignId] = useState<string | null>(r.campaignId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setCloakOn(r.cloakOn); }, [r.cloakOn]);

  const fullPath = r.path ? `${r.domain}/${r.path}` : r.domain;
  const pagesArr = pages.split("\n").map((s) => s.trim()).filter(Boolean);
  const dirty =
    JSON.stringify(pagesArr) !== JSON.stringify(r.whitepages ?? []) ||
    (targetUrl.trim() || null) !== (r.targetUrl ?? null) ||
    campaignId !== r.campaignId;

  return (
    <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
      {/* Cabecera */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
        <Shuffle className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-muted-foreground)" }} />
        <span className="min-w-0 flex-1 truncate font-mono text-sm" style={{ color: "var(--color-foreground)" }}>{fullPath}</span>
        <a href={`https://${fullPath}`} target="_blank" rel="noopener noreferrer" title="Abrir"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:opacity-70" style={{ color: "var(--color-muted-foreground)" }}>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button type="button" title="Eliminar" disabled={remove.isPending}
          onClick={() => { if (confirm(`¿Eliminar el redirector ${fullPath}?`)) remove.mutate({ id: r.id }); }}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:opacity-70" style={{ color: "var(--color-muted-foreground)" }}>
          {remove.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="space-y-4 p-4">
        {/* Switch */}
        <div className="flex items-center gap-3 rounded-lg p-3" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
          <Switch on={cloakOn} pending={setCloak.isPending} onToggle={() => setCloak.mutate({ id: r.id, cloakOn: !cloakOn })} />
          <div className="min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
              {cloakOn ? "Cloaking activo" : "Directo a la landing"}
            </p>
            <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
              {cloakOn ? "Rota una whitepage de la lista." : "Manda a la landing de la campaña elegida."}
            </p>
          </div>
        </div>

        {/* Panel whitepages (ON) */}
        <Panel active={cloakOn} icon={<ListPlus className="h-3.5 w-3.5" />} title="Whitepages (cloak prendido)">
          <textarea
            value={pages} onChange={(e) => setPages(e.target.value)} rows={4}
            placeholder={"https://safe-page-1.com\nhttps://safe-page-2.com"}
            className="w-full resize-y rounded-md px-3 py-2 text-xs outline-none"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}
          />
          <p className="mt-1 text-[11px]" style={{ color: "var(--color-subtle)" }}>Una URL por línea. Se elige una al azar en cada visita. ({pagesArr.length})</p>
        </Panel>

        {/* Panel landing (OFF) */}
        <Panel active={!cloakOn} icon={<Target className="h-3.5 w-3.5" />} title="Landing de campaña (cloak apagado)">
          <div className="flex items-center gap-2">
            <input
              value={targetUrl} onChange={(e) => { setCampaignId(null); setTargetUrl(e.target.value); }}
              placeholder="https://empfohlen.lat/mi-slug"
              className="min-w-0 flex-1 rounded-md px-3 py-2 text-xs outline-none"
              style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}
            />
            <button type="button" onClick={() => setPickerOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors"
              style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
              <Search className="h-3.5 w-3.5" /> Elegir campaña
            </button>
          </div>
        </Panel>

        {/* Guardar */}
        <div className="flex items-center gap-3">
          <button type="button" disabled={!dirty || save.isPending}
            onClick={() => save.mutate({ id: r.id, whitepages: pagesArr, targetUrl: targetUrl.trim() || null, campaignId })}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
            {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Guardar
          </button>
          {saved && <span className="text-xs" style={{ color: "var(--color-success)" }}>Guardado ✓</span>}
          {save.error && <span className="text-xs" style={{ color: "var(--color-error)" }}>{save.error.message}</span>}
        </div>
      </div>

      {pickerOpen && (
        <CampaignPickerModal
          onClose={() => setPickerOpen(false)}
          onSelect={(url, id) => { setTargetUrl(url); setCampaignId(id); setPickerOpen(false); }}
        />
      )}
    </div>
  );
}

function Panel({ active, icon, title, children }: { active: boolean; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-3 transition-opacity"
      style={{ border: `1px solid ${active ? "var(--color-border-focus)" : "var(--color-border)"}`, opacity: active ? 1 : 0.5 }}>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: active ? "var(--color-foreground)" : "var(--color-subtle)" }}>
        {icon} {title}
        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: "var(--color-success)" }} />}
      </div>
      {children}
    </div>
  );
}

function Switch({ on, pending, onToggle }: { on: boolean; pending: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={pending} onClick={onToggle}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60"
      style={{ background: on ? "var(--color-success)" : "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
      <span className="inline-block h-4 w-4 rounded-full transition-transform"
        style={{ background: "#fff", transform: on ? "translateX(22px)" : "translateX(3px)" }} />
    </button>
  );
}

function CampaignPickerModal({ onClose, onSelect }: { onClose: () => void; onSelect: (url: string, id: string) => void }) {
  const campaignsQ = api.campaign.list.useQuery();
  const [show, setShow] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const landingUrl = (c: { domain: string | null; slug: string }) =>
    c.domain ? `https://${c.domain}/${c.slug}` : `${origin}/landing/${c.slug}`;

  const all = campaignsQ.data ?? [];
  const list = q ? all.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.slug.includes(q.toLowerCase())) : all;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: show ? "blur(8px)" : "blur(0)", WebkitBackdropFilter: show ? "blur(8px)" : "blur(0)", opacity: show ? 1 : 0, transition: "opacity .2s ease, backdrop-filter .2s ease" }}>
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl"
        style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", opacity: show ? 1 : 0, transform: show ? "scale(1)" : "scale(0.97)", transition: "opacity .2s ease, transform .25s cubic-bezier(0.22,1,0.36,1)" }}>
        <div className="flex shrink-0 items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar campaña…"
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--color-foreground)" }} />
          <button type="button" onClick={onClose} style={{ color: "var(--color-subtle)" }}><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {campaignsQ.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
          ) : list.length === 0 ? (
            <p className="py-8 text-center text-xs" style={{ color: "var(--color-subtle)" }}>Sin campañas.</p>
          ) : list.map((c) => {
            const url = landingUrl(c);
            return (
              <button key={c.id} type="button" onClick={() => onSelect(url, c.id)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors"
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.colorPrimary }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm" style={{ color: "var(--color-foreground)" }}>{c.name}</span>
                  <span className="block truncate font-mono text-[11px]" style={{ color: "var(--color-subtle)" }}>{url}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
