"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Heart, MessageSquare, Bookmark, Loader2, Wallet, Search,
  RefreshCw, Check, X, AlertTriangle, Trash2, ClipboardPaste, ListPlus, Plus, Lock,
} from "lucide-react";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";

import { t } from "@/lib/i18n-client";
/* ─── IDs de servicio habilitados en DripFeed ─── */
const RANGES = {
  comments: [5824, 5828, 7162, 8976, 9035, 13237, 16386, 16387],
  likes:    [8615],
  saves:    [9031],
};

type Service = {
  service: string;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
};

type Recent = {
  uid: string;
  kind: "comments" | "likes" | "saves";
  service: string;
  count: number;
  orderId?: string;
  ts: number;
  failed?: boolean;
};

const LINK_KEY   = "smm_order_link";
const RECENT_KEY = "smm_recent_orders";

async function smm<T = unknown>(params: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/smm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Error ${res.status}`);
  return data;
}

function relTime(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export default function InteractionsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const utils = api.useUtils();
  const defaults = api.interactions.defaults.useQuery();
  const presets = api.interactions.presets.useQuery();
  const setDefault = api.interactions.setDefault.useMutation({
    onSuccess: async () => { await utils.interactions.defaults.invalidate(); },
  });

  const [pasteErr, setPasteErr] = useState<string | null>(null);
  const [presetId, setPresetId] = useState("");

  const [services, setServices] = useState<Service[]>([]);
  const [loadingSvc, setLoadingSvc] = useState(true);
  const [svcError, setSvcError] = useState<string | null>(null);

  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBal, setLoadingBal] = useState(false);

  const [link, setLink] = useState("");
  const [recent, setRecent] = useState<Recent[]>([]);

  // Per-card state
  const [commentsSvc, setCommentsSvc] = useState("");
  const [commentsText, setCommentsText] = useState("");
  const [likesSvc, setLikesSvc] = useState("");
  const [likesQty, setLikesQty] = useState("");
  const [savesSvc, setSavesSvc] = useState("");
  const [savesQty, setSavesQty] = useState("");

  // Confirmation modal
  const [confirm, setConfirm] = useState<null | {
    kind: Recent["kind"];
    service: string;
    count: number;
    run: () => Promise<void>;
  }>(null);
  const [placing, setPlacing] = useState(false);

  // Status check
  const [statusInput, setStatusInput] = useState("");
  const [statusOut, setStatusOut] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  /* Load persisted link + recent */
  useEffect(() => {
    try {
      setLink(localStorage.getItem(LINK_KEY) ?? "");
      const r = localStorage.getItem(RECENT_KEY);
      if (r) setRecent(JSON.parse(r) as Recent[]);
    } catch { /* ignore */ }
  }, []);

  const persistLink = useCallback((v: string) => {
    setLink(v);
    try { localStorage.setItem(LINK_KEY, v); } catch { /* ignore */ }
  }, []);

  const pushRecent = useCallback((r: Recent) => {
    setRecent((prev) => {
      const next = [r, ...prev].slice(0, 50);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const markRecent = useCallback((uid: string, failed: boolean) => {
    setRecent((prev) => {
      const next = prev.map((r) => (r.uid === uid ? { ...r, failed } : r));
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Los defaults llegan por query; se leen por ref para no re-disparar la carga
  // del catalogo cada vez que cambian.
  const defaultsRef = useRef({ comments: null as string | null, likes: null as string | null, saves: null as string | null });
  useEffect(() => {
    if (defaults.data) defaultsRef.current = defaults.data;
  }, [defaults.data]);

  /* Load services catalog */
  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingSvc(true);
      setSvcError(null);
      try {
        const data = await smm<Service[]>({ action: "services" });
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setServices(list);
        // El servicio fijado por el admin manda; si no hay, el primero del rango.
        const pick = (ids: number[], fixed?: string | null) =>
          (fixed && ids.includes(Number(fixed)) ? fixed : null) ??
          list.find((s) => ids.includes(Number(s.service)))?.service ??
          String(ids[0]);
        setCommentsSvc(pick(RANGES.comments, defaultsRef.current.comments));
        setLikesSvc(pick(RANGES.likes, defaultsRef.current.likes));
        setSavesSvc(pick(RANGES.saves, defaultsRef.current.saves));
      } catch (e) {
        if (active) setSvcError(e instanceof Error ? e.message : "Error cargando servicios");
      } finally {
        if (active) setLoadingSvc(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Si los defaults llegan despues del catalogo, aplicarlos igual.
  useEffect(() => {
    const d = defaults.data;
    if (!d) return;
    if (d.comments && RANGES.comments.includes(Number(d.comments))) setCommentsSvc(d.comments);
    if (d.likes && RANGES.likes.includes(Number(d.likes))) setLikesSvc(d.likes);
    if (d.saves && RANGES.saves.includes(Number(d.saves))) setSavesSvc(d.saves);
  }, [defaults.data]);

  /** Pega el link desde el portapapeles. */
  async function pasteLink() {
    setPasteErr(null);
    try {
      const txt = (await navigator.clipboard.readText()).trim();
      if (!txt) { setPasteErr(t("El portapapeles está vacío")); return; }
      persistLink(txt);
    } catch {
      // Safari/permiso denegado: no se puede leer el portapapeles por script.
      setPasteErr(t("El navegador no dejó leer el portapapeles. Pegá con Ctrl+V."));
    }
  }

  /** Carga una lista de comentarios del admin en el textarea. */
  function applyPreset(id: string) {
    setPresetId(id);
    const p = presets.data?.find((x) => x.id === id);
    if (p) setCommentsText(p.comments.join("\n"));
  }

  async function loadBalance() {
    setLoadingBal(true);
    try {
      const data = await smm<{ balance?: string; currency?: string }>({ action: "balance" });
      setBalance(`${data.balance ?? "—"} ${data.currency ?? ""}`.trim());
    } catch (e) {
      setBalance(e instanceof Error ? e.message : "Error");
    } finally {
      setLoadingBal(false);
    }
  }

  /**
   * Devuelve SIEMPRE los IDs configurados, en orden, enriquecidos con los datos
   * del catálogo cuando existen. Antes se filtraba contra el catálogo y los IDs
   * que no aparecían se descartaban en silencio, así que no había forma de notar
   * que un servicio configurado ya no existe en el panel.
   */
  function svcOptions(ids: number[]) {
    return ids.map((id) => {
      const hit = services.find((s) => Number(s.service) === id);
      return hit ?? { service: String(id), name: "", type: "", category: "", rate: "", min: "", max: "" };
    });
  }

  /** `id · nombre · $rate/1k · min–max`. En los paneles SMM el rate es por 1000. */
  function svcLabel(s: Service) {
    const parts = [s.service];
    parts.push(s.name || t("no está en el catálogo"));
    if (s.rate) parts.push(`$${s.rate}/1k`);
    if (s.min && s.max) parts.push(`${s.min}–${s.max}`);
    return parts.join(" · ");
  }

  /* Place order (after confirm) */
  function requestOrder(kind: Recent["kind"]) {
    if (!link.trim()) { alert("Pegá el link de la publicación primero."); return; }

    if (kind === "comments") {
      const lines = commentsText.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) { alert("Escribí al menos un comentario."); return; }
      setConfirm({
        kind, service: commentsSvc, count: lines.length,
        run: async () => {
          const data = await smm<{ order?: number }>({ action: "add", service: Number(commentsSvc), link: link.trim(), comments: lines.join("\n") });
          pushRecent({ uid: crypto.randomUUID(), kind, service: commentsSvc, count: lines.length, orderId: data.order != null ? String(data.order) : undefined, ts: Date.now() });
          logSpend.mutate({ kind: "interaction", amount: priceOf(commentsSvc, lines.length), ref: data.order != null ? String(data.order) : undefined, note: `comments x${lines.length}` });
        },
      });
    } else {
      const svc = kind === "likes" ? likesSvc : savesSvc;
      const qtyRaw = kind === "likes" ? likesQty : savesQty;
      const qty = parseInt(qtyRaw, 10);
      if (!qty || qty <= 0) { alert("Ingresá una cantidad válida."); return; }
      setConfirm({
        kind, service: svc, count: qty,
        run: async () => {
          const data = await smm<{ order?: number }>({ action: "add", service: Number(svc), link: link.trim(), quantity: qty });
          pushRecent({ uid: crypto.randomUUID(), kind, service: svc, count: qty, orderId: data.order != null ? String(data.order) : undefined, ts: Date.now() });
          logSpend.mutate({ kind: "interaction", amount: priceOf(svc, qty), ref: data.order != null ? String(data.order) : undefined, note: `${kind} x${qty}` });
        },
      });
    }
  }

  // Costo SMM (rate por 1000) → atribuido al usuario
  const logSpend = api.accounting.logSpend.useMutation();
  function priceOf(serviceId: string, count: number) {
    const s = services.find((x) => x.service === serviceId);
    const rate = s ? parseFloat(s.rate) : 0;
    return Number.isFinite(rate) && rate > 0 ? (count / 1000) * rate : 0;
  }

  async function runConfirm() {
    if (!confirm) return;
    setPlacing(true);
    try {
      await confirm.run();
      setConfirm(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al colocar la orden");
    } finally {
      setPlacing(false);
    }
  }

  async function checkStatus() {
    const ids = statusInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return;
    setLoadingStatus(true);
    setStatusOut(null);
    try {
      const data = ids.length === 1
        ? await smm({ action: "status", order: ids[0] })
        : await smm({ action: "status", orders: ids.join(",") });
      setStatusOut(JSON.stringify(data, null, 2));
    } catch (e) {
      setStatusOut(e instanceof Error ? e.message : "Error");
    } finally {
      setLoadingStatus(false);
    }
  }

  function clearRecent() {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch { /* ignore */ }
  }

  const KIND_META = {
    comments: { label: "Coment.", color: "#a78bfa" },
    likes:    { label: "Likes",   color: "#4ade80" },
    saves:    { label: "Saves",   color: "#60a5fa" },
  } as const;

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="flex h-14 shrink-0 items-center gap-2 px-4 md:px-8"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <Heart className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{t("Interacciones")}</h1>
        <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>DripFeed</span>
      </header>

      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* ── Columna principal ── */}
          <div className="space-y-5">
            {/* Balance (solo admin) + link */}
            <div className={`grid gap-4 ${isAdmin ? "sm:grid-cols-2" : ""}`}>
              {isAdmin && (
              <Card>
                <CardLabel>{t("Balance")}</CardLabel>
                <div className="mt-2 flex items-center gap-3">
                  <span className="flex-1 truncate font-mono text-lg font-bold tabular-nums" style={{ color: "var(--color-foreground)" }}>
                    {balance ?? "—"}
                  </span>
                  <button
                    type="button"
                    onClick={loadBalance}
                    disabled={loadingBal}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
                    style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                  >
                    {loadingBal ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
                    Consultar
                  </button>
                </div>
              </Card>
              )}

              <Card>
                <CardLabel>{t("Link de la publicación")}</CardLabel>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    value={link}
                    onChange={(e) => persistLink(e.target.value)}
                    placeholder="https://www.instagram.com/p/…"
                    className="min-w-0 flex-1 rounded-md px-3 py-2 text-sm outline-none"
                    style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                  />
                  <button
                    type="button"
                    onClick={() => void pasteLink()}
                    title={t("Pegar del portapapeles")}
                    className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-80"
                    style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}
                  >
                    <ClipboardPaste className="h-4 w-4" />
                  </button>
                  {link && (
                    <button
                      type="button"
                      onClick={() => persistLink("")}
                      title={t("Limpiar")}
                      className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-80"
                      style={{ border: "1px solid var(--color-border)", color: "var(--color-subtle)" }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {pasteErr && <p className="mt-1.5 text-[11px]" style={{ color: "var(--color-warning)" }}>{pasteErr}</p>}
              </Card>
            </div>

            {isAdmin && <PresetManager />}

            {svcError && (
              <div className="flex items-start gap-3 rounded-xl p-4" style={{ background: "var(--color-error-bg)", border: "1px solid color-mix(in oklch, var(--color-error) 25%, transparent)" }}>
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--color-error)" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-error)" }}>{t("No se pudo cargar el catálogo")}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>{svcError}</p>
                </div>
              </div>
            )}

            {/* Order cards */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Comentarios */}
              <Card>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" style={{ color: "#a78bfa" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{t("Comentarios")}</p>
                </div>
                {isAdmin ? (
                  <>
                    <ServiceSelect loading={loadingSvc} value={commentsSvc} onChange={(v) => { setCommentsSvc(v); setDefault.mutate({ kind: "comments", service: v }); }} options={svcOptions(RANGES.comments)} label={svcLabel} />
                    <p className="mt-1 text-[10px]" style={{ color: "var(--color-subtle)" }}>{t("Lo que elijas queda fijado para todos")}</p>
                  </>
                ) : (
                  <FixedService loading={loadingSvc} label={svcLabel(svcOptions(RANGES.comments).find((o) => o.service === commentsSvc) ?? svcOptions(RANGES.comments)[0]!)} />
                )}
                {(presets.data?.length ?? 0) > 0 && (
                  <div className="mt-2">
                    <select
                      value={presetId}
                      onChange={(e) => applyPreset(e.target.value)}
                      className="w-full rounded-md px-2.5 py-2 text-xs outline-none"
                      style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                    >
                      <option value="">{t("Elegí una lista de comentarios…")}</option>
                      {presets.data!.map((p) => (
                        <option key={p.id} value={p.id} style={{ background: "var(--color-surface-raised)" }}>
                          {p.name} ({p.comments.length})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <textarea
                  value={commentsText}
                  onChange={(e) => { setCommentsText(e.target.value); setPresetId(""); }}
                  placeholder={"Un comentario por línea…"}
                  rows={5}
                  className="mt-2 w-full resize-none rounded-md px-3 py-2 text-xs outline-none"
                  style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}
                />
                <p className="mt-1 text-[10px]" style={{ color: "var(--color-subtle)" }}>
                  {commentsText.split("\n").filter((l) => l.trim()).length} comentarios
                </p>
                <OrderButton onClick={() => requestOrder("comments")}>{t("Enviar comentarios")}</OrderButton>
              </Card>

              {/* Likes */}
              <Card>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4" style={{ color: "#4ade80" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{t("Likes")}</p>
                </div>
                {isAdmin ? (
                  <>
                    <ServiceSelect loading={loadingSvc} value={likesSvc} onChange={(v) => { setLikesSvc(v); setDefault.mutate({ kind: "likes", service: v }); }} options={svcOptions(RANGES.likes)} label={svcLabel} />
                    <p className="mt-1 text-[10px]" style={{ color: "var(--color-subtle)" }}>{t("Lo que elijas queda fijado para todos")}</p>
                  </>
                ) : (
                  <FixedService loading={loadingSvc} label={svcLabel(svcOptions(RANGES.likes).find((o) => o.service === likesSvc) ?? svcOptions(RANGES.likes)[0]!)} />
                )}
                <input
                  type="number"
                  value={likesQty}
                  onChange={(e) => setLikesQty(e.target.value)}
                  placeholder={t("Cantidad")}
                  className="mt-2 w-full rounded-md px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                />
                <OrderButton onClick={() => requestOrder("likes")}>{t("Enviar likes")}</OrderButton>
              </Card>

              {/* Saves */}
              <Card>
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4" style={{ color: "#60a5fa" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{t("Saves")}</p>
                </div>
                {isAdmin ? (
                  <>
                    <ServiceSelect loading={loadingSvc} value={savesSvc} onChange={(v) => { setSavesSvc(v); setDefault.mutate({ kind: "saves", service: v }); }} options={svcOptions(RANGES.saves)} label={svcLabel} />
                    <p className="mt-1 text-[10px]" style={{ color: "var(--color-subtle)" }}>{t("Lo que elijas queda fijado para todos")}</p>
                  </>
                ) : (
                  <FixedService loading={loadingSvc} label={svcLabel(svcOptions(RANGES.saves).find((o) => o.service === savesSvc) ?? svcOptions(RANGES.saves)[0]!)} />
                )}
                <input
                  type="number"
                  value={savesQty}
                  onChange={(e) => setSavesQty(e.target.value)}
                  placeholder={t("Cantidad")}
                  className="mt-2 w-full rounded-md px-3 py-2 text-sm outline-none"
                  style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                />
                <OrderButton onClick={() => requestOrder("saves")}>{t("Enviar saves")}</OrderButton>
              </Card>
            </div>

            {/* Status check */}
            <Card>
              <CardLabel>{t("Estado de órdenes")}</CardLabel>
              <div className="mt-2 flex gap-2">
                <div className="flex flex-1 items-center gap-2 rounded-md px-3 py-2" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
                  <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
                  <input
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    placeholder={t("ID(s) separados por coma…")}
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "var(--color-foreground)" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={loadingStatus}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium"
                  style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                >
                  {loadingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Consultar
                </button>
              </div>
              {statusOut && (
                <pre className="mt-3 max-h-48 overflow-auto rounded-md p-3 text-[11px]" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
                  {statusOut}
                </pre>
              )}
            </Card>
          </div>

          {/* ── Historial reciente ── */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>{t("Recientes")}</p>
              {recent.length > 0 && (
                <button type="button" onClick={clearRecent} className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--color-subtle)" }}>
                  <Trash2 className="h-3 w-3" /> Limpiar
                </button>
              )}
            </div>
            <div className="space-y-2">
              {recent.length === 0 ? (
                <div className="rounded-xl py-8 text-center" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
                  <p className="text-xs" style={{ color: "var(--color-subtle)" }}>{t("Sin órdenes todavía.")}</p>
                </div>
              ) : recent.map((r) => {
                const meta = KIND_META[r.kind];
                return (
                  <div
                    key={r.uid}
                    className="rounded-xl p-3"
                    style={{
                      border: `1px solid ${r.failed ? "color-mix(in oklch, var(--color-error) 35%, transparent)" : "var(--color-border)"}`,
                      background: r.failed ? "var(--color-error-bg)" : "var(--color-surface-raised)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--color-surface-overlay)", color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>{relTime(r.ts)}</span>
                      <span className="ml-auto text-[11px] tabular-nums" style={{ color: "var(--color-muted-foreground)" }}>×{r.count}</span>
                    </div>
                    <p className="mt-1 text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>
                      svc {r.service}{r.orderId ? ` · orden ${r.orderId}` : ""}
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      <button type="button" onClick={() => markRecent(r.uid, false)} className="flex-1 rounded px-2 py-1 text-[10px] font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-success)" }}>
                        ✓ Funcionó
                      </button>
                      <button type="button" onClick={() => markRecent(r.uid, true)} className="flex-1 rounded px-2 py-1 text-[10px] font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-error)" }}>
                        ✗ Falló
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* ── Modal de confirmación ── */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget && !placing) setConfirm(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" style={{ color: "var(--color-warning)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{t("Confirmar orden")}</p>
            </div>
            <p className="mt-3 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              {KIND_META[confirm.kind].label} · servicio <span className="font-mono">{confirm.service}</span> {t("· cantidad")} <span className="font-semibold tabular-nums">{confirm.count}</span>
            </p>
            <p className="mt-1 break-all text-[11px]" style={{ color: "var(--color-subtle)" }}>{link}</p>
            <p className="mt-3 text-[11px]" style={{ color: "var(--color-warning)" }}>
              Esto coloca una orden real y consume tu balance.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={placing}
                className="flex-1 rounded-md py-2 text-sm font-medium"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={runConfirm}
                disabled={placing}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold"
                style={{ background: "var(--color-error)", color: "#fff" }}
              >
                {placing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Colocar orden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-componentes ─── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>
      {children}
    </p>
  );
}

function OrderButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 w-full rounded-md py-2 text-xs font-semibold transition-opacity hover:opacity-90"
      style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
    >
      {children}
    </button>
  );
}

function ServiceSelect({
  loading, value, onChange, options, label,
}: {
  loading: boolean;
  value: string;
  onChange: (v: string) => void;
  options: Service[];
  label: (s: Service) => string;
}) {
  return (
    <div className="mt-3">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full rounded-md px-3 py-2 text-xs outline-none"
        style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
      >
        {loading && <option>{t("Cargando…")}</option>}
        {!loading && options.map((s) => (
          <option key={s.service} value={s.service}>{label(s)}</option>
        ))}
      </select>
    </div>
  );
}

/** Servicio fijo: lo que ve un usuario no admin, sin poder cambiarlo. */
function FixedService({ loading, label }: { loading: boolean; label: string }) {
  return (
    <div
      className="mt-2 flex items-center gap-2 rounded-md px-3 py-2"
      style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}
    >
      <Lock className="h-3 w-3 shrink-0" style={{ color: "var(--color-subtle)" }} />
      <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        {loading ? t("Cargando…") : label}
      </span>
    </div>
  );
}

/** Alta y borrado de listas de comentarios. Solo admin. */
function PresetManager() {
  const utils = api.useUtils();
  const presets = api.interactions.presets.useQuery();
  const create = api.interactions.createPreset.useMutation({
    onSuccess: async () => { setName(""); setText(""); setOpen(false); await utils.interactions.presets.invalidate(); },
  });
  const del = api.interactions.deletePreset.useMutation({
    onSuccess: async () => { await utils.interactions.presets.invalidate(); },
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div className="rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="flex items-center gap-2">
        <ListPlus className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{t("Listas de comentarios")}</p>
        <span className="rounded-full px-2 py-0.5 text-[10px] tabular-nums"
          style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>
          {presets.data?.length ?? 0}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
        >
          <Plus className="h-3 w-3" /> {t("Nueva lista")}
        </button>
      </div>

      {open && (
        <div className="enter-down mt-3 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("Nombre de la lista")}
            className="w-full rounded-md px-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={"Un comentario por línea…"}
            className="w-full resize-y rounded-md px-3 py-2 text-xs outline-none"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}
          />
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>{lines.length} {t("comentarios")}</span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => create.mutate({ name: name.trim(), comments: lines })}
              disabled={!name.trim() || lines.length === 0 || create.isPending}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
            >
              {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {t("Guardar")}
            </button>
          </div>
        </div>
      )}

      {(presets.data?.length ?? 0) > 0 && (
        <div className="mt-3 space-y-1.5">
          {presets.data!.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
              style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
              <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--color-foreground)" }}>{p.name}</span>
              <span className="shrink-0 text-[10px] tabular-nums" style={{ color: "var(--color-subtle)" }}>{p.comments.length}</span>
              <button type="button" onClick={() => del.mutate({ id: p.id })} title={t("Eliminar")}
                className="shrink-0 transition-opacity hover:opacity-70" style={{ color: "var(--color-subtle)" }}>
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
