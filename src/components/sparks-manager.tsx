"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import ReactCountryFlag from "react-country-flag";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import { LOCALES, getLocaleByCode } from "@/lib/locales";
import { tiktokEmbedSrc } from "@/lib/tiktok";
import {
  Sparkles, Plus, Play, Star, Check, Loader2, X, Trash2, Pencil,
  Zap, MessageSquare, Package, AlertTriangle, EyeOff, Flag,
} from "lucide-react";

type CatalogItem = RouterOutputs["sparks"]["list"][number];
type ManageItem = RouterOutputs["sparks"]["manage"][number];
type AnySpark = { tiktokUrl: string | null; title: string };

export function SparksManager() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [tab, setTab] = useState<"catalog" | "manage">("catalog");
  const [kind, setKind] = useState<"WH" | "BH">("WH");
  const [player, setPlayer] = useState<AnySpark | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Sparkles className="h-4 w-4" style={{ color: "var(--color-foreground)" }} />
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Sparks</h1>
        {isAdmin && (
          <nav className="ml-2 flex gap-1 rounded-lg p-0.5" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
            {([["catalog", "Catálogo"], ["manage", "Gestión"]] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setTab(k)}
                className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
                style={{ background: tab === k ? "var(--color-surface-overlay)" : "transparent", color: tab === k ? "var(--color-foreground)" : "var(--color-muted-foreground)" }}>
                {label}
              </button>
            ))}
          </nav>
        )}
        {isAdmin && (
          <button type="button" onClick={() => setUploadOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
            <Plus className="h-3.5 w-3.5" /> Subir spark
          </button>
        )}
      </header>

      <main className="flex-1 px-4 py-6 md:px-8">
        <KindToggle kind={kind} onChange={setKind} />
        {tab === "catalog" && <CatalogGrid kind={kind} onPlay={setPlayer} />}
        {tab === "manage" && isAdmin && <ManageGrid kind={kind} onPlay={setPlayer} />}
      </main>

      {player && <PlayerModal spark={player} onClose={() => setPlayer(null)} />}
      {uploadOpen && <SparkFormModal defaultKind={kind} onClose={() => setUploadOpen(false)} />}
    </div>
  );
}

/* ───────── Catálogo ───────── */
function CatalogGrid({ kind, onPlay }: { kind: "WH" | "BH"; onPlay: (s: AnySpark) => void }) {
  const utils = api.useUtils();
  const q = api.sparks.list.useQuery({ kind });
  const rate = api.sparks.rate.useMutation({ onSuccess: () => void utils.sparks.list.invalidate() });

  if (q.isLoading) return <Spinner />;
  const items = q.data ?? [];
  if (!items.length) return <Empty msg="No hay sparks de este tipo todavía." />;

  return (
    <Grid>
      {items.map((s) => <CatalogCard key={s.id} s={s} onPlay={() => onPlay(s)} onRate={(stars) => rate.mutate({ sparkId: s.id, stars })} />)}
    </Grid>
  );
}

function CatalogCard({ s, onPlay, onRate }: { s: CatalogItem; onPlay: () => void; onRate: (n: number) => void }) {
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <Card>
      <Thumb spark={s} onPlay={s.tiktokUrl ? onPlay : undefined} />
      <div className="flex flex-1 flex-col p-3">
        <Meta s={s} />
        <p className="mt-1 line-clamp-2 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{s.title}</p>
        {s.description && <p className="mt-0.5 line-clamp-2 text-[11px]" style={{ color: "var(--color-subtle)" }}>{s.description}</p>}

        <div className="mt-1.5 flex items-center gap-2 text-[11px]" style={{ color: "var(--color-subtle)" }}>
          <Stars value={s.myStars} onChange={onRate} />
          <span>{s.ratingsCount ? `${s.avgRating.toFixed(1)} (${s.ratingsCount})` : "sin ratings"}</span>
        </div>

        {/* Copiar spark code — un click */}
        <button type="button"
          onClick={() => { navigator.clipboard.writeText(s.sparkCode).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-colors"
          style={{ background: copied ? "var(--color-success)" : "var(--color-foreground)", color: "var(--color-background)" }}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {copied ? "¡Copiado!" : "Copiar spark code"}
        </button>

        <button type="button" onClick={() => setReportOpen(true)}
          className="mt-2 inline-flex items-center justify-center gap-1 text-[11px] transition-opacity hover:opacity-70" style={{ color: "var(--color-muted-foreground)" }}>
          <Flag className="h-3 w-3" /> Reportar
        </button>
      </div>
      {reportOpen && <ReportModal sparkId={s.id} title={s.title} onClose={() => setReportOpen(false)} />}
    </Card>
  );
}

/* ───────── Gestión (admin) ───────── */
function ManageGrid({ kind, onPlay }: { kind: "WH" | "BH"; onPlay: (s: AnySpark) => void }) {
  const utils = api.useUtils();
  const q = api.sparks.manage.useQuery();
  const setUsable = api.sparks.setUsable.useMutation({ onSuccess: () => { void utils.sparks.manage.invalidate(); void utils.sparks.list.invalidate(); }, onError: (e) => alert(e.message) });
  const remove = api.sparks.remove.useMutation({ onSuccess: () => { void utils.sparks.manage.invalidate(); void utils.sparks.list.invalidate(); } });

  const [editing, setEditing] = useState<ManageItem | null>(null);
  const [boosting, setBoosting] = useState<ManageItem | null>(null);
  const [feedback, setFeedback] = useState<ManageItem | null>(null);
  const [reports, setReports] = useState<ManageItem | null>(null);

  if (q.isLoading) return <Spinner />;
  const items = (q.data ?? []).filter((s) => s.kind === kind);
  if (!items.length) return <Empty msg="No hay sparks de este tipo." />;

  return (
    <>
      <Grid>
        {items.map((s) => {
          const disabled = s.status === "disabled";
          return (
            <Card key={s.id}>
              <Thumb spark={s} onPlay={s.tiktokUrl ? () => onPlay(s) : undefined} />
              <div className="flex flex-1 flex-col p-3">
                <div className="flex items-center gap-2">
                  <Meta s={s} />
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: disabled ? "var(--color-subtle)" : "var(--color-success)" }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: disabled ? "var(--color-subtle)" : "var(--color-success)" }} />{disabled ? "No usable" : "Activo"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{s.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]" style={{ color: "var(--color-subtle)" }}>
                  <Stars value={Math.round(s.avgRating)} readOnly />
                  <span>{s.ratingsCount || 0}</span>
                  {s.reportsCount > 0 && <span style={{ color: "var(--color-error)" }}>· {s.reportsCount} reporte{s.reportsCount > 1 ? "s" : ""}</span>}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Act onClick={() => setBoosting(s)} icon={<Zap className="h-3.5 w-3.5" />} label="Botear" />
                  <Act onClick={() => setFeedback(s)} icon={<MessageSquare className="h-3.5 w-3.5" />} label="Feedback" />
                  <Act onClick={() => setReports(s)} icon={<Flag className="h-3.5 w-3.5" />} label={s.reportsCount ? `Reportes (${s.reportsCount})` : "Reportes"} />
                  <Act onClick={() => setUsable.mutate({ id: s.id, usable: disabled })}
                    icon={disabled ? <Check className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    label={disabled ? "Reactivar" : "No usable"} />
                  <button type="button" title="Editar" onClick={() => setEditing(s)} className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md" style={{ color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}><Pencil className="h-3.5 w-3.5" /></button>
                  <button type="button" title="Borrar" onClick={() => { if (confirm(`¿Borrar "${s.title}"?`)) remove.mutate({ id: s.id }); }} className="inline-flex h-7 w-7 items-center justify-center rounded-md" style={{ color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </Card>
          );
        })}
      </Grid>
      {editing && <SparkFormModal edit={editing} onClose={() => setEditing(null)} />}
      {boosting && <BoostModal spark={boosting} onClose={() => setBoosting(null)} />}
      {feedback && <FeedbackModal spark={feedback} onClose={() => setFeedback(null)} />}
      {reports && <ReportsModal spark={reports} onClose={() => setReports(null)} />}
    </>
  );
}

/* ───────── bits ───────── */
function KindToggle({ kind, onChange }: { kind: "WH" | "BH"; onChange: (k: "WH" | "BH") => void }) {
  const opts: { k: "WH" | "BH"; sub: string }[] = [{ k: "WH", sub: "White hat" }, { k: "BH", sub: "Black hat" }];
  return (
    <div className="mb-5 inline-flex gap-1 rounded-lg p-1" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
      {opts.map((o) => {
        const on = kind === o.k;
        return (
          <button key={o.k} type="button" onClick={() => onChange(o.k)} className="rounded-md px-4 py-1.5 text-xs font-semibold transition-colors"
            style={{ background: on ? "var(--color-foreground)" : "transparent", color: on ? "var(--color-background)" : "var(--color-muted-foreground)" }}>
            {o.k} <span className="font-normal opacity-70">· {o.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>{children}</div>;
}
function Meta({ s }: { s: { countryCode: string; language: string } }) {
  const loc = getLocaleByCode(s.language);
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: "var(--color-subtle)" }}>
      <ReactCountryFlag countryCode={s.countryCode} svg style={{ width: "1.15em", height: "0.85em", borderRadius: 2 }} />
      {loc?.label ?? s.language}
    </span>
  );
}
function Thumb({ spark, onPlay }: { spark: { thumbnailUrl?: string | null; authorName?: string | null; isCarousel?: boolean; tiktokUrl?: string | null }; onPlay?: () => void }) {
  const playable = !!spark.tiktokUrl && !!onPlay;
  return (
    <button type="button" onClick={playable ? onPlay : undefined} disabled={!playable}
      className="group relative block h-44 w-full overflow-hidden" style={{ background: "var(--color-surface-overlay)", cursor: playable ? "pointer" : "default" }}>
      {spark.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={spark.thumbnailUrl} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      ) : (
        <span className="flex h-full w-full items-center justify-center"><Sparkles className="h-7 w-7" style={{ color: "var(--color-subtle)" }} /></span>
      )}
      {playable && (
        <span className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "rgba(0,0,0,0.55)" }}>
            <Play className="h-5 w-5" style={{ color: "#fff", fill: "#fff" }} />
          </span>
        </span>
      )}
      {spark.isCarousel && <span className="absolute right-2 top-2 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase" style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>carrusel</span>}
      {spark.authorName && <span className="absolute bottom-1.5 left-2 truncate text-[10px]" style={{ color: "rgba(255,255,255,0.85)", maxWidth: "80%" }}>@{spark.authorName}</span>}
    </button>
  );
}
function Stars({ value, onChange, readOnly }: { value: number; onChange?: (n: number) => void; readOnly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= (hover || value);
        return (
          <button key={n} type="button" disabled={readOnly} onClick={() => onChange?.(n)}
            onMouseEnter={() => !readOnly && setHover(n)} onMouseLeave={() => setHover(0)}
            style={{ cursor: readOnly ? "default" : "pointer", lineHeight: 0 }}>
            <Star className="h-3.5 w-3.5" style={{ color: on ? "var(--color-warning)" : "var(--color-subtle)", fill: on ? "var(--color-warning)" : "transparent" }} />
          </button>
        );
      })}
    </span>
  );
}
function Act({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
      style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>{icon} {label}</button>
  );
}
function Spinner() { return <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>; }
function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl py-16 text-center" style={{ border: "1px dashed var(--color-border)" }}>
      <Sparkles className="mx-auto h-6 w-6" style={{ color: "var(--color-subtle)" }} />
      <p className="mt-3 text-sm" style={{ color: "var(--color-muted-foreground)" }}>{msg}</p>
    </div>
  );
}

/* ───────── Modal base ───────── */
function Modal({ onClose, children, maxW = "max-w-md" }: { onClose: () => void; children: React.ReactNode; maxW?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(raf); document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: show ? "blur(8px)" : "blur(0)", WebkitBackdropFilter: show ? "blur(8px)" : "blur(0)", opacity: show ? 1 : 0, transition: "opacity .2s ease, backdrop-filter .2s ease" }}>
      <div className={`flex max-h-[90vh] w-full ${maxW} flex-col overflow-hidden rounded-2xl`}
        style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 24px 80px rgba(0,0,0,0.8)", opacity: show ? 1 : 0, transform: show ? "scale(1)" : "scale(0.97)", transition: "opacity .2s ease, transform .25s cubic-bezier(0.22,1,0.36,1)" }}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
function ModalHead({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex shrink-0 items-center px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
      <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{title}</p>
      <button type="button" onClick={onClose} className="ml-auto" style={{ color: "var(--color-subtle)" }}><X className="h-4 w-4" /></button>
    </div>
  );
}

/* ───────── Player ───────── */
function PlayerModal({ spark, onClose }: { spark: AnySpark; onClose: () => void }) {
  const src = spark.tiktokUrl ? tiktokEmbedSrc(spark.tiktokUrl) : null;
  return (
    <Modal onClose={onClose} maxW="max-w-sm">
      <ModalHead title={spark.title} onClose={onClose} />
      <div className="p-3">
        {src ? (
          <iframe src={src} title={spark.title} allow="encrypted-media; fullscreen" allowFullScreen
            style={{ width: "100%", height: "72vh", border: "none", borderRadius: 12, background: "#000" }} />
        ) : (
          <p className="py-10 text-center text-sm" style={{ color: "var(--color-subtle)" }}>Este spark no tiene link de TikTok.</p>
        )}
      </div>
    </Modal>
  );
}

/* ───────── Subir / editar ───────── */
function SparkFormModal({ onClose, edit, defaultKind = "WH" }: { onClose: () => void; edit?: ManageItem; defaultKind?: "WH" | "BH" }) {
  const utils = api.useUtils();
  const refresh = () => { void utils.sparks.list.invalidate(); void utils.sparks.manage.invalidate(); };
  const create = api.sparks.create.useMutation({ onSuccess: () => { refresh(); onClose(); }, onError: (e) => setErr(e.message) });
  const update = api.sparks.update.useMutation({ onSuccess: () => { refresh(); onClose(); }, onError: (e) => setErr(e.message) });

  const [title, setTitle] = useState(edit?.title ?? "");
  const [description, setDescription] = useState(edit?.description ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(edit?.tiktokUrl ?? "");
  const [sparkCode, setSparkCode] = useState(edit?.sparkCode ?? "");
  const [language, setLanguage] = useState(edit?.language ?? "en");
  const [kind, setKind] = useState<"WH" | "BH">(edit?.kind === "BH" ? "BH" : defaultKind);
  const [err, setErr] = useState<string | null>(null);

  const pending = create.isPending || update.isPending;
  const valid = title.trim() && sparkCode.trim();

  function submit() {
    setErr(null);
    if (edit) update.mutate({ id: edit.id, title, description, sparkCode, language, kind });
    else create.mutate({ title, description, tiktokUrl, sparkCode, language, kind });
  }

  return (
    <Modal onClose={onClose}>
      <ModalHead title={edit ? "Editar spark" : "Subir spark"} onClose={onClose} />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <Field label="Tipo">
          <div className="inline-flex gap-1 rounded-md p-0.5" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
            {(["WH", "BH"] as const).map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)} className="rounded px-4 py-1.5 text-xs font-semibold transition-colors"
                style={{ background: kind === k ? "var(--color-foreground)" : "transparent", color: kind === k ? "var(--color-background)" : "var(--color-muted-foreground)" }}>
                {k} <span className="font-normal opacity-70">· {k === "WH" ? "White hat" : "Black hat"}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Título"><Inp value={title} onChange={setTitle} placeholder="Hook de Martina" /></Field>
        <Field label="Descripción (opcional)"><Inp value={description} onChange={setDescription} placeholder="Notas para el usuario" /></Field>
        {!edit && <Field label="URL del TikTok (opcional)"><Inp value={tiktokUrl} onChange={setTiktokUrl} placeholder="Dejar vacío si no aplica" mono /></Field>}
        <Field label="Spark code"><Inp value={sparkCode} onChange={setSparkCode} placeholder="#TT..." mono /></Field>
        <Field label="Mercado (idioma / país)">
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-md px-3 py-2 text-sm outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
            {LOCALES.map((l) => <option key={l.code} value={l.code} style={{ background: "var(--color-surface-raised)" }}>{l.label}</option>)}
          </select>
        </Field>
        {err && <p className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-error)" }}><AlertTriangle className="h-3.5 w-3.5" /> {err}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2 px-5 py-3" style={{ borderTop: "1px solid var(--color-border)" }}>
        <button type="button" onClick={onClose} className="ml-auto rounded-md px-3 py-1.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Cancelar</button>
        <button type="button" disabled={!valid || pending} onClick={submit}
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} {edit ? "Guardar" : "Subir"}
        </button>
      </div>
    </Modal>
  );
}

/* ───────── Botear ───────── */
const BOOST_FIELDS: { key: string; label: string }[] = [
  { key: "views", label: "Views" }, { key: "likes", label: "Likes" },
  { key: "shares", label: "Shares" }, { key: "saves", label: "Saves" }, { key: "follows", label: "Follows" },
];
function BoostModal({ spark, onClose }: { spark: ManageItem; onClose: () => void }) {
  const bankQ = api.sparks.commentBank.useQuery({ language: spark.language });
  const boost = api.sparks.boost.useMutation({ onSuccess: onClose, onError: (e) => setErr(e.message) });
  const [inter, setInter] = useState<Record<string, string>>({ views: "1000", likes: "200", shares: "", saves: "", follows: "" });
  const [comments, setComments] = useState("");
  const [touched, setTouched] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (bankQ.data && !touched) setComments(bankQ.data.join("\n")); }, [bankQ.data, touched]);

  function submit() {
    setErr(null);
    const interactions: Record<string, number> = {};
    for (const f of BOOST_FIELDS) { const n = parseInt(inter[f.key] ?? "", 10); if (n > 0) interactions[f.key] = n; }
    boost.mutate({ sparkId: spark.id, interactions, comments: comments.split("\n").map((s) => s.trim()).filter(Boolean) });
  }

  return (
    <Modal onClose={onClose}>
      <ModalHead title={`Botear · ${spark.title}`} onClose={onClose} />
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>Engagement a empujar vía panel SMM. Comentarios prellenados en {getLocaleByCode(spark.language)?.label ?? spark.language}.</p>
        <div className="grid grid-cols-3 gap-2">
          {BOOST_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>
              <input type="number" min={0} value={inter[f.key] ?? ""} onChange={(e) => setInter((p) => ({ ...p, [f.key]: e.target.value }))}
                className="w-full rounded-md px-2.5 py-1.5 text-sm tabular-nums outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
            </Field>
          ))}
        </div>
        <Field label="Comentarios (uno por línea)">
          <textarea value={comments} onChange={(e) => { setTouched(true); setComments(e.target.value); }} rows={5}
            className="w-full resize-y rounded-md px-3 py-2 text-xs outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
        </Field>
        {err && <p className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-error)" }}><AlertTriangle className="h-3.5 w-3.5" /> {err}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2 px-5 py-3" style={{ borderTop: "1px solid var(--color-border)" }}>
        <button type="button" onClick={onClose} className="ml-auto rounded-md px-3 py-1.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>Cancelar</button>
        <button type="button" disabled={boost.isPending} onClick={submit}
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
          {boost.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} Lanzar boost
        </button>
      </div>
    </Modal>
  );
}

/* ───────── Feedback ───────── */
function FeedbackModal({ spark, onClose }: { spark: ManageItem; onClose: () => void }) {
  const q = api.sparks.feedback.useQuery({ sparkId: spark.id });
  const items = q.data ?? [];
  return (
    <Modal onClose={onClose}>
      <ModalHead title={`Feedback · ${spark.title}`} onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {q.isLoading ? <Spinner /> : items.length === 0 ? (
          <p className="py-6 text-center text-xs" style={{ color: "var(--color-subtle)" }}>Sin ratings todavía.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((r) => (
              <li key={r.id} className="rounded-lg p-3" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{r.username}</span>
                  <span className="ml-auto"><Stars value={r.stars} readOnly /></span>
                </div>
                {r.comment && <p className="mt-1.5 text-xs" style={{ color: "var(--color-muted-foreground)" }}>{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

/* ───────── Reportes ───────── */
const REASONS: { value: "no_interactions" | "review_not_approved" | "other"; label: string }[] = [
  { value: "no_interactions", label: "Falta de interacciones" },
  { value: "review_not_approved", label: "Review no aprobada" },
  { value: "other", label: "Otro" },
];
const REASON_LABEL: Record<string, string> = Object.fromEntries(REASONS.map((r) => [r.value, r.label]));

function ReportModal({ sparkId, title, onClose }: { sparkId: string; title: string; onClose: () => void }) {
  const [reason, setReason] = useState<"no_interactions" | "review_not_approved" | "other">("no_interactions");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const report = api.sparks.report.useMutation({ onSuccess: () => { setDone(true); setTimeout(onClose, 900); } });
  return (
    <Modal onClose={onClose} maxW="max-w-sm">
      <ModalHead title={`Reportar · ${title}`} onClose={onClose} />
      <div className="space-y-3 px-5 py-4">
        {done ? (
          <p className="py-6 text-center text-sm font-medium" style={{ color: "var(--color-success)" }}>Reporte enviado ✓</p>
        ) : (
          <>
            <Field label="Motivo">
              <div className="flex flex-col gap-1.5">
                {REASONS.map((r) => (
                  <button key={r.value} type="button" onClick={() => setReason(r.value)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors"
                    style={{ border: `1px solid ${reason === r.value ? "var(--color-border-focus)" : "var(--color-border)"}`, background: reason === r.value ? "var(--color-surface-overlay)" : "transparent", color: "var(--color-foreground)" }}>
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ border: "1px solid var(--color-subtle)", background: reason === r.value ? "var(--color-foreground)" : "transparent" }} />
                    {r.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Detalle (opcional)"><Inp value={note} onChange={setNote} placeholder="Qué pasó…" /></Field>
            <button type="button" disabled={report.isPending} onClick={() => report.mutate({ sparkId, reason, note })}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
              {report.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flag className="h-3.5 w-3.5" />} Enviar reporte
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

function ReportsModal({ spark, onClose }: { spark: ManageItem; onClose: () => void }) {
  const utils = api.useUtils();
  const q = api.sparks.reports.useQuery({ sparkId: spark.id });
  const resolve = api.sparks.resolveReport.useMutation({ onSuccess: () => { void utils.sparks.reports.invalidate({ sparkId: spark.id }); void utils.sparks.manage.invalidate(); } });
  const items = q.data ?? [];
  return (
    <Modal onClose={onClose}>
      <ModalHead title={`Reportes · ${spark.title}`} onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {q.isLoading ? <Spinner /> : items.length === 0 ? (
          <p className="py-6 text-center text-xs" style={{ color: "var(--color-subtle)" }}>Sin reportes.</p>
        ) : (
          <ul className="space-y-2.5">
            {items.map((r) => (
              <li key={r.id} className="rounded-lg p-3" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)", opacity: r.status === "resolved" ? 0.6 : 1 }}>
                <div className="flex items-center gap-2">
                  <Flag className="h-3.5 w-3.5 shrink-0" style={{ color: r.status === "resolved" ? "var(--color-subtle)" : "var(--color-error)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{REASON_LABEL[r.reason] ?? r.reason}</span>
                  <span className="truncate text-[11px]" style={{ color: "var(--color-subtle)" }}>· {r.username}</span>
                  <button type="button" onClick={() => resolve.mutate({ id: r.id, resolved: r.status !== "resolved" })}
                    className="ml-auto shrink-0 text-[11px] transition-opacity hover:opacity-70" style={{ color: "var(--color-muted-foreground)" }}>
                    {r.status === "resolved" ? "Reabrir" : "Resolver"}
                  </button>
                </div>
                {r.note && <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>{r.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

/* ───────── inputs ───────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5"><label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>{children}</div>;
}
function Inp({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
    className="w-full rounded-md px-3 py-2 text-sm outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontFamily: mono ? "var(--font-mono)" : undefined }} />;
}
