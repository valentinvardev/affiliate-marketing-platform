"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import ReactCountryFlag from "react-country-flag";
import { api } from "@/trpc/react";
import { TARGET_COUNTRIES } from "@/lib/target-countries";
import { downscaleImage } from "@/lib/downscale-image";
import { ImageEditor } from "@/components/image-editor";
import {
  Brain, Sparkles, Copy, Check, Loader2, Trash2, Upload, Plus, Clock, Gamepad2, TrendingUp, ImageIcon, Languages, ImagePlus, X, AlertTriangle, ThumbsUp, ThumbsDown,
} from "lucide-react";

type Texts = { hook_text: string; hook_variants: string[]; proof_text: string; caption: string };
type Angle = Texts & { angle_name: string; demographic_target: string; why_it_works: string; translation_es: Texts };
type Market = { trends: string[]; best_ad_hours: string[]; top_games: string[] };
type Loaded = { id: string; country: string; market: Market; angles: Angle[] };

const flagOf = (name: string) => TARGET_COUNTRIES.find((c) => c.name === name)?.code;

export function AnglesManager() {
  const [country, setCountry] = useState(TARGET_COUNTRIES[0]?.name ?? "");
  const [campaignId, setCampaignId] = useState("");
  const [modal, setModal] = useState<Loaded | null>(null);
  const [imgTab, setImgTab] = useState<"hook" | "proof">("hook");

  const campaignsQ = api.campaign.list.useQuery();
  const utils = api.useUtils();
  const generate = api.angles.generate.useMutation({
    onSuccess: (r) => { setModal({ id: r.id, country: r.country, market: r.market_analysis, angles: r.angles }); void utils.angles.list.invalidate(); },
    onError: (e) => alert(e.message),
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Brain className="h-4 w-4" style={{ color: "var(--color-foreground)" }} />
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Ángulos</h1>
        <span className="ml-2 text-[11px]" style={{ color: "var(--color-subtle)" }}>TikTok Ads · Gemini</span>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6 md:px-8">
        {/* Generador */}
        <div className="rounded-xl p-4" style={{ border: "1px solid var(--color-border-focus)", background: "linear-gradient(180deg, var(--color-surface-overlay), transparent)" }}>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: "var(--color-muted-foreground)" }}>País</span>
              <select value={country} onChange={(e) => setCountry(e.target.value)}
                className="rounded-md px-3 py-2 text-sm outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
                {TARGET_COUNTRIES.map((c) => <option key={c.id} value={c.name} style={{ background: "var(--color-surface-raised)" }}>{c.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium" style={{ color: "var(--color-muted-foreground)" }}>Campaña (métricas, opcional)</span>
              <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}
                className="rounded-md px-3 py-2 text-sm outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
                <option value="" style={{ background: "var(--color-surface-raised)" }}>— ninguna —</option>
                {(campaignsQ.data ?? []).map((c) => <option key={c.id} value={c.id} style={{ background: "var(--color-surface-raised)" }}>{c.name}</option>)}
              </select>
            </label>
            <button type="button" disabled={generate.isPending || !country} onClick={() => generate.mutate({ country, campaignId: campaignId || undefined })}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
              {generate.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Generar ángulos
            </button>
          </div>
          {generate.isPending && <p className="mt-3 text-xs" style={{ color: "var(--color-subtle)" }}>Gemini está analizando el mercado de {country}…</p>}
        </div>

        {/* Gestión de imágenes por pestañas */}
        <div>
          <div className="mb-3 inline-flex gap-1 rounded-lg p-1" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
            {([["hook", "Hooks (imagen 1)"], ["proof", "Proofs (imagen 2)"]] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setImgTab(k)} className="rounded-md px-4 py-1.5 text-xs font-semibold transition-colors"
                style={{ background: imgTab === k ? "var(--color-foreground)" : "transparent", color: imgTab === k ? "var(--color-background)" : "var(--color-muted-foreground)" }}>
                {label}
              </button>
            ))}
          </div>
          {imgTab === "hook"
            ? <AssetLibrary country={country} kind="hook" title="Fotos hook (imagen 1)" hint="Subí las fotos de la primera imagen del anuncio." />
            : <AssetLibrary country={country} kind="proof" title="Proofs de pago (imagen 2)" hint="Subí las capturas reales de pago." />}
        </div>

        <KbSection country={country} />
        <History onLoad={setModal} />
      </main>

      {modal && <AngleModal data={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

/* ── Modal del ángulo ── */
function AngleModal({ data, onClose }: { data: Loaded; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="my-4 w-full max-w-2xl overflow-hidden rounded-2xl" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}>
        <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
          {flagOf(data.country) && <ReactCountryFlag countryCode={flagOf(data.country)!} svg style={{ width: "1.2em", height: "0.9em", borderRadius: 2 }} />}
          <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Ángulo · {data.country}</p>
          <button type="button" onClick={onClose} className="ml-auto" style={{ color: "var(--color-subtle)" }}><X className="h-4 w-4" /></button>
        </div>
        <div className="p-4"><AngleView data={data} /></div>
      </div>
    </div>,
    document.body,
  );
}

/* ── Resultado ── */
function AngleView({ data }: { data: Loaded }) {
  const [es, setEs] = useState(false); // false = idioma nativo, true = español
  const [editor, setEditor] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setEditor(true)}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
          <ImagePlus className="h-3.5 w-3.5" /> Armar creativo
        </button>
        <AngleMediaStrip angleId={data.id} />
      </div>
      {editor && <ImageEditor angleId={data.id} country={data.country} onClose={() => setEditor(false)} />}
      {/* Market analysis (siempre en inglés) */}
      <div className="rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
        <div className="mb-3 flex items-center gap-2">
          {flagOf(data.country) && <ReactCountryFlag countryCode={flagOf(data.country)!} svg style={{ width: "1.2em", height: "0.9em", borderRadius: 2 }} />}
          <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Market analysis · {data.country}</p>
          <button type="button" onClick={() => setEs((v) => !v)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
            <Languages className="h-3.5 w-3.5" /> {es ? "Ver original" : "Ver en español"}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <MarketCol icon={<TrendingUp className="h-3.5 w-3.5" />} title="Trends" items={data.market.trends} />
          <MarketCol icon={<Clock className="h-3.5 w-3.5" />} title="Best hours" items={data.market.best_ad_hours} />
          <MarketCol icon={<Gamepad2 className="h-3.5 w-3.5" />} title="Top games" items={data.market.top_games} />
        </div>
      </div>

      {/* Angles */}
      {data.angles.map((a, i) => {
        const t: Texts = es ? a.translation_es : a;
        return (
          <div key={i} className="rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" style={{ background: "var(--color-surface-overlay)", color: "var(--color-foreground)" }}>{i + 1}</span>
              <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{a.angle_name}</p>
              <span className="ml-auto text-[11px]" style={{ color: "var(--color-subtle)" }}>{a.demographic_target}</span>
            </div>
            <Copyable label={`Hook (Imagen 1)${es ? " · ES" : ""}`} value={t.hook_text} />
            {t.hook_variants?.length > 0 && (
              <div className="mt-1.5 space-y-1">
                {t.hook_variants.map((h, j) => <Copyable key={j} label={`Variante ${j + 1}`} value={h} small />)}
              </div>
            )}
            <Copyable label={`Proof (texto sobre tu imagen)${es ? " · ES" : ""}`} value={t.proof_text} />
            <Copyable label={`Caption + CTA${es ? " · ES" : ""}`} value={t.caption} />
            {a.why_it_works && <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "var(--color-subtle)" }}><span style={{ color: "var(--color-muted-foreground)" }}>Por qué funciona:</span> {a.why_it_works}</p>}
            <AngleFeedback angleId={data.id} angleName={a.angle_name} />
          </div>
        );
      })}
    </div>
  );
}

/* Feedback de un ángulo → Gemini lo consolida en un aprendizaje para la base */
function AngleFeedback({ angleId, angleName }: { angleId: string; angleName: string }) {
  const utils = api.useUtils();
  const [outcome, setOutcome] = useState<null | "worked" | "failed">(null);
  const [note, setNote] = useState("");
  const fb = api.angles.feedback.useMutation({
    onSuccess: () => void utils.angles.kbList.invalidate(),
    onError: (e) => alert(e.message),
  });

  if (fb.isSuccess) {
    return (
      <div className="mt-2.5 flex items-start gap-1.5 rounded-md px-3 py-2 text-[11px]" style={{ background: "var(--color-success-bg)", border: "1px solid var(--color-border)" }}>
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-success)" }} />
        <span style={{ color: "var(--color-foreground)" }}><span style={{ color: "var(--color-success)" }}>Aprendizaje agregado a la base:</span> {fb.data.entry}</span>
      </div>
    );
  }

  return (
    <div className="mt-2.5 rounded-md px-3 py-2" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-subtle)" }}>Feedback</span>
        <button type="button" onClick={() => setOutcome("worked")} className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium"
          style={{ border: `1px solid ${outcome === "worked" ? "var(--color-success)" : "var(--color-border)"}`, color: outcome === "worked" ? "var(--color-success)" : "var(--color-muted-foreground)" }}>
          <ThumbsUp className="h-3 w-3" /> Funcionó
        </button>
        <button type="button" onClick={() => setOutcome("failed")} className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium"
          style={{ border: `1px solid ${outcome === "failed" ? "var(--color-error)" : "var(--color-border)"}`, color: outcome === "failed" ? "var(--color-error)" : "var(--color-muted-foreground)" }}>
          <ThumbsDown className="h-3 w-3" /> No funcionó
        </button>
      </div>
      {outcome && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
            placeholder="Nota opcional: qué viste (métricas, comentarios, público…). Gemini lo resume como aprendizaje."
            className="w-full resize-none rounded-md px-2.5 py-2 text-xs outline-none" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
          <button type="button" disabled={fb.isPending} onClick={() => fb.mutate({ angleId, angleName, outcome, note: note.trim() || undefined })}
            className="inline-flex w-fit items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
            {fb.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />} Aprender de esto
          </button>
        </div>
      )}
    </div>
  );
}
function AngleMediaStrip({ angleId }: { angleId: string }) {
  const utils = api.useUtils();
  const q = api.angles.mediaList.useQuery({ angleId });
  const remove = api.angles.mediaRemove.useMutation({ onSuccess: () => void utils.angles.mediaList.invalidate() });
  const items = q.data ?? [];
  if (!items.length) return <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>Sin creativos guardados.</span>;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((m) => (
        <div key={m.id} className="group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <a href={m.url} target="_blank" rel="noopener noreferrer"><img src={m.url} alt="" className="h-14 w-14 rounded-md object-cover" style={{ border: "1px solid var(--color-border)" }} /></a>
          <button type="button" onClick={() => remove.mutate({ id: m.id })}
            className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100" style={{ background: "var(--color-error)", color: "#fff" }}>
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
function MarketCol({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <div className="rounded-lg p-3" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-subtle)" }}>{icon} {title}</div>
      <ul className="space-y-1 text-xs" style={{ color: "var(--color-foreground)" }}>
        {(items ?? []).map((x, i) => <li key={i}>• {x}</li>)}
      </ul>
    </div>
  );
}
function Copyable({ label, value, small }: { label: string; value: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={small ? "mt-0" : "mt-2.5"}>
      {!small && <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-subtle)" }}>{label}</p>}
      <div className="flex items-start gap-2 rounded-md px-3 py-2" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
        <span className="min-w-0 flex-1 text-xs leading-relaxed" style={{ color: small ? "var(--color-muted-foreground)" : "var(--color-foreground)" }}>{small ? `${label}: ` : ""}{value}</span>
        <button type="button" title="Copiar" onClick={() => { navigator.clipboard.writeText(value).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="shrink-0" style={{ color: copied ? "var(--color-success)" : "var(--color-muted-foreground)" }}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

/* ── Librería de imágenes (proof | hook) ── */
function AssetLibrary({ country, kind, title, hint }: { country: string; kind: "proof" | "hook"; title: string; hint: string }) {
  const utils = api.useUtils();
  const q = api.angles.proofList.useQuery({ country, kind });
  const add = api.angles.proofAdd.useMutation({ onSuccess: () => void utils.angles.proofList.invalidate() });
  const remove = api.angles.proofRemove.useMutation({ onSuccess: () => void utils.angles.proofList.invalidate() });
  const [pending, setPending] = useState<{ id: string; preview: string; error?: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files; if (!files?.length) return; e.target.value = "";
    const batch = Array.from(files).map((file) => ({ file, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, preview: URL.createObjectURL(file) }));
    setPending((p) => [...batch.map((b) => ({ id: b.id, preview: b.preview })), ...p]);
    for (const b of batch) {
      try {
        const prepared = await downscaleImage(b.file);
        const fd = new FormData(); fd.append("file", prepared);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          setPending((p) => p.map((x) => (x.id === b.id ? { ...x, error: d.error ?? `Error ${res.status}` } : x)));
          continue;
        }
        const data = (await res.json()) as { url?: string };
        if (data.url) await add.mutateAsync({ country, url: data.url, kind });
        setPending((p) => p.filter((x) => x.id !== b.id));
        URL.revokeObjectURL(b.preview);
      } catch (err) {
        setPending((p) => p.map((x) => (x.id === b.id ? { ...x, error: err instanceof Error ? err.message : "Error" } : x)));
      }
    }
  }
  const uploading = pending.some((p) => !p.error);

  const items = q.data ?? [];
  return (
    <section className="rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
      <div className="mb-3 flex items-center gap-2">
        <ImageIcon className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{title} · {country}</p>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif,.heic,.heif" multiple hidden onChange={onFile} />
        <button type="button" onClick={() => inputRef.current?.click()}
          className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Subir
        </button>
      </div>
      {items.length === 0 && pending.length === 0 ? (
        <p className="py-6 text-center text-xs" style={{ color: "var(--color-subtle)" }}>{hint}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {pending.map((pp) => (
            <div key={pp.id} className="relative overflow-hidden rounded-lg" style={{ border: `1px solid ${pp.error ? "var(--color-error)" : "var(--color-border)"}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pp.preview} alt="" className="aspect-[3/4] w-full object-cover" style={{ opacity: 0.35 }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-1.5 text-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                {pp.error ? (
                  <>
                    <AlertTriangle className="h-4 w-4" style={{ color: "#fca5a5" }} />
                    <span className="text-[9px] leading-tight" style={{ color: "#fca5a5" }}>{pp.error}</span>
                    <button type="button" onClick={() => setPending((p) => p.filter((x) => x.id !== pp.id))} className="text-[9px] underline" style={{ color: "#fff" }}>quitar</button>
                  </>
                ) : <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#fff" }} />}
              </div>
            </div>
          ))}
          {items.map((p) => (
            <div key={p.id} className="relative overflow-hidden rounded-lg" style={{ border: "1px solid var(--color-border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <a href={p.url} target="_blank" rel="noopener noreferrer"><img src={p.url} alt={p.label ?? ""} className="aspect-[3/4] w-full object-cover" /></a>
              <button type="button" title="Eliminar" disabled={remove.isPending} onClick={() => remove.mutate({ id: p.id })}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md" style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Base de conocimientos ── */
function KbSection({ country }: { country: string }) {
  const utils = api.useUtils();
  const q = api.angles.kbList.useQuery({ country });
  const add = api.angles.kbAdd.useMutation({ onSuccess: () => { setEntry(""); setTags(""); void utils.angles.kbList.invalidate(); } });
  const remove = api.angles.kbRemove.useMutation({ onSuccess: () => void utils.angles.kbList.invalidate() });
  const [entry, setEntry] = useState("");
  const [tags, setTags] = useState("");

  const items = q.data ?? [];
  return (
    <section className="rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
      <div className="mb-3 flex items-center gap-2">
        <Brain className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Base de conocimientos · {country}</p>
        <span className="ml-auto inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--color-subtle)" }}><Sparkles className="h-3 w-3" /> manual o automática (feedback de ángulos)</span>
      </div>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <input value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="Aprendizaje: qué ángulo/persona/juego convierte acá…"
          className="min-w-0 flex-1 rounded-md px-3 py-2 text-sm outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags (coma)"
          className="w-28 rounded-md px-3 py-2 text-xs outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
        <button type="button" disabled={!entry.trim() || add.isPending} onClick={() => add.mutate({ country, entry, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) })}
          className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium disabled:opacity-40" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
          <Plus className="h-3.5 w-3.5" /> Agregar
        </button>
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-center text-xs" style={{ color: "var(--color-subtle)" }}>Sin aprendizajes para {country} todavía.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((k) => (
            <li key={k.id} className="flex items-start gap-2 rounded-md px-3 py-2 text-xs" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
              <span className="min-w-0 flex-1" style={{ color: "var(--color-foreground)" }}>{k.entry}{k.tags.length > 0 && <span style={{ color: "var(--color-subtle)" }}> · {k.tags.join(", ")}</span>}</span>
              <button type="button" onClick={() => remove.mutate({ id: k.id })} style={{ color: "var(--color-subtle)" }}><Trash2 className="h-3 w-3" /></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ── Historial ── */
function History({ onLoad }: { onLoad: (l: Loaded) => void }) {
  const utils = api.useUtils();
  const q = api.angles.list.useQuery();
  const remove = api.angles.remove.useMutation({ onSuccess: () => void utils.angles.list.invalidate() });
  const items = q.data ?? [];
  if (!items.length) return null;
  return (
    <section className="rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Generados</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((r) => (
          <li key={r.id} className="flex items-center gap-2 rounded-md px-3 py-2 text-xs" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
            {flagOf(r.country) && <ReactCountryFlag countryCode={flagOf(r.country)!} svg style={{ width: "1.1em", height: "0.8em", borderRadius: 2 }} />}
            <span style={{ color: "var(--color-foreground)" }}>{r.country}</span>
            <span style={{ color: "var(--color-subtle)" }}>{new Date(r.createdAt).toLocaleDateString("es")}</span>
            <button type="button" onClick={() => onLoad({ id: r.id, country: r.country, market: r.market as Market, angles: r.angles as Angle[] })}
              className="ml-auto rounded-md px-2 py-1 text-[11px] font-medium" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>Ver</button>
            <button type="button" onClick={() => remove.mutate({ id: r.id })} style={{ color: "var(--color-subtle)" }}><Trash2 className="h-3 w-3" /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}
