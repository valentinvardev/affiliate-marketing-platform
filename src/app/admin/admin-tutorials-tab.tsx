"use client";

import { useRef, useState } from "react";
import {
  GraduationCap, Upload, Loader2, X, Plus, Trash2, ListVideo, Check, Film, Clock,
} from "lucide-react";
import { api } from "@/trpc/react";
import { fmtTime } from "@/components/tutorials/video-player";
import { t } from "@/lib/i18n-client";

type Draft = { timeSec: number; title: string };

/** Sube el archivo directo a Supabase con la URL firmada, reportando progreso. */
function putWithProgress(url: string, file: File, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(file);
  });
}

/** Lee duración (y un frame como poster) del archivo local, sin tocar el server. */
function probeVideo(file: File): Promise<{ durationSec: number; poster: Blob | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.src = url;
    const done = (durationSec: number, poster: Blob | null) => {
      URL.revokeObjectURL(url);
      resolve({ durationSec, poster });
    };
    v.onloadedmetadata = () => {
      const d = Math.round(v.duration || 0);
      // Buscar un frame representativo (~10% del video) para el poster.
      v.currentTime = Math.min(Math.max(d * 0.1, 0.5), Math.max(d - 0.1, 0.5));
      v.onseeked = () => {
        try {
          const c = document.createElement("canvas");
          c.width = v.videoWidth; c.height = v.videoHeight;
          c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
          c.toBlob((b) => done(d, b), "image/jpeg", 0.82);
        } catch { done(d, null); }
      };
      setTimeout(() => done(d, null), 4000); // por si onseeked no dispara
    };
    v.onerror = () => done(0, null);
  });
}

export function AdminTutorialsTab() {
  const utils = api.useUtils();
  const list = api.tutorial.list.useQuery();
  const signUrl = api.tutorial.createUploadUrl.useMutation();
  const create = api.tutorial.create.useMutation({
    onSuccess: async () => { reset(); await utils.tutorial.list.invalidate(); },
  });
  const del = api.tutorial.delete.useMutation({
    onSuccess: async () => { await utils.tutorial.list.invalidate(); },
  });
  const setChapters = api.tutorial.setChapters.useMutation({
    onSuccess: async () => { setEditing(null); await utils.tutorial.list.invalidate(); },
  });

  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState("");
  const [chapters, setChaptersDraft] = useState<Draft[]>([]);
  const [pct, setPct] = useState<number | null>(null);
  const [dur, setDur] = useState(0);
  const [poster, setPoster] = useState<Blob | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Edición del índice de un video ya subido
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft[]>([]);

  function reset() {
    setFile(null); setTitle(""); setDesc(""); setCat("");
    setChaptersDraft([]); setPct(null); setDur(0); setErr(null);
    setPoster(null);
    setPosterPreview((u) => { if (u) URL.revokeObjectURL(u); return null; });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function pick(f: File | null) {
    setErr(null);
    if (!f) return;
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    const { durationSec, poster: frame } = await probeVideo(f);
    setDur(durationSec);
    setPoster(frame);
    setPosterPreview((u) => { if (u) URL.revokeObjectURL(u); return frame ? URL.createObjectURL(frame) : null; });
  }

  async function submit() {
    if (!file || !title.trim() || pct !== null) return;
    setErr(null);
    try {
      setPct(0);
      const { signedUrl, publicUrl } = await signUrl.mutateAsync({
        filename: file.name,
        contentType: file.type,
      });
      await putWithProgress(signedUrl, file, setPct);
      setPct(100);

      // Miniatura: mismo circuito firmado, con el frame sacado del propio video.
      let posterUrl: string | null = null;
      if (poster) {
        try {
          const p = await signUrl.mutateAsync({ filename: "poster.jpg", contentType: "image/jpeg" });
          await putWithProgress(p.signedUrl, new File([poster], "poster.jpg", { type: "image/jpeg" }), () => undefined);
          posterUrl = p.publicUrl;
        } catch { /* sin miniatura: la tarjeta cae al icono de play */ }
      }

      create.mutate({
        posterUrl,
        title: title.trim(),
        description: desc.trim() || null,
        category: cat.trim() || null,
        videoUrl: publicUrl,
        durationSec: dur || null,
        chapters: chapters.filter((c) => c.title.trim()).map((c) => ({ ...c, title: c.title.trim() })),
      });
    } catch (e) {
      setPct(null);
      setErr(e instanceof Error ? e.message : t("Falló la subida"));
    }
  }

  const busy = pct !== null || create.isPending;

  return (
    <div className="space-y-6">
      {/* ── Subir ── */}
      <div className="rounded-xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
        <div className="mb-1 flex items-center gap-2">
          <GraduationCap className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{t("Subir tutorial")}</h2>
        </div>
        <p className="mb-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          {t("El archivo va directo a Supabase, no pasa por el servidor. MP4, WEBM o MOV.")}
        </p>

        {/* Dropzone */}
        <label
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl px-4 py-8 text-center transition-colors"
          style={{ border: `1px dashed ${file ? "var(--color-border-focus)" : "var(--color-border)"}`, background: "var(--color-surface-overlay)" }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void pick(e.dataTransfer.files?.[0] ?? null); }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="sr-only"
            onChange={(e) => void pick(e.target.files?.[0] ?? null)}
          />
          {posterPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={posterPreview} alt="" className="mb-2 rounded" style={{ maxHeight: 96, border: "1px solid var(--color-border)" }} />
          ) : (
            <Film className="mb-2 h-6 w-6" style={{ color: "var(--color-subtle)" }} />
          )}
          {file ? (
            <>
              <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{file.name}</span>
              <span className="mt-1 text-[11px]" style={{ color: "var(--color-subtle)" }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB{dur ? ` · ${fmtTime(dur)}` : ""}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{t("Arrastrá el video o hacé click")}</span>
              <span className="mt-1 text-[11px]" style={{ color: "var(--color-subtle)" }}>{t("Sin límite de tamaño del servidor")}</span>
            </>
          )}
        </label>

        {file && (
          <div className="mt-4 space-y-3">
            <Field label={t("Título")}>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("Cómo crear tu primera campaña")} />
            </Field>
            <Field label={t("Descripción")}>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                placeholder={t("Qué se explica en el video…")}
                className="w-full resize-y rounded-md px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              />
            </Field>
            <Field label={t("Categoría")} hint={t("Agrupa los videos en la vista de usuarios. Opcional.")}>
              <Input value={cat} onChange={(e) => setCat(e.target.value)} placeholder={t("Primeros pasos")} />
            </Field>

            <ChapterEditor value={chapters} onChange={setChaptersDraft} maxSec={dur} />

            {err && (
              <p className="rounded-md px-3 py-2 text-xs" style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}>{err}</p>
            )}

            {pct !== null && (
              <div>
                <div className="mb-1 flex items-center justify-between text-[11px]" style={{ color: "var(--color-muted-foreground)" }}>
                  <span>{create.isPending ? t("Guardando…") : t("Subiendo…")}</span>
                  <span className="tabular-nums">{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--color-surface-overlay)" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "var(--color-foreground)", transition: "width .2s ease" }} />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!title.trim() || busy}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
                style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                {t("Subir tutorial")}
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-opacity disabled:opacity-40"
                style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              >
                {t("Cancelar")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Listado ── */}
      <div className="rounded-xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
        <h2 className="mb-4 text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
          {t("Tutoriales publicados")}
        </h2>

        {list.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skel" style={{ height: 58, borderRadius: 10 }} />)}
          </div>
        ) : !list.data?.length ? (
          <p className="py-8 text-center text-xs" style={{ color: "var(--color-subtle)" }}>{t("Todavía no hay tutoriales")}</p>
        ) : (
          <div className="space-y-2">
            {list.data.map((v) => (
              <div key={v.id} className="rounded-lg p-3" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded" style={{ background: "var(--color-surface-raised)" }}>
                    {v.posterUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={v.posterUrl} alt="" className="h-full w-full object-cover" />
                      : <Film className="h-4 w-4" style={{ color: "var(--color-subtle)" }} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{v.title}</p>
                    <p className="mt-0.5 flex items-center gap-2.5 text-[11px]" style={{ color: "var(--color-subtle)" }}>
                      {v.durationSec ? <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(v.durationSec)}</span> : null}
                      <span className="inline-flex items-center gap-1"><ListVideo className="h-3 w-3" />{v.chapters.length}</span>
                      {v.category && <span>{v.category}</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(editing === v.id ? null : v.id);
                      setEditDraft(v.chapters.map((c) => ({ timeSec: c.timeSec, title: c.title })));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-opacity hover:opacity-80"
                    style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                  >
                    <ListVideo className="h-3 w-3" /> {t("Índice")}
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (confirm(t("¿Eliminar este tutorial?"))) del.mutate({ id: v.id }); }}
                    title={t("Eliminar")}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-opacity hover:opacity-70"
                    style={{ color: "var(--color-error)", border: "1px solid var(--color-border)" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {editing === v.id && (
                  <div className="enter-down mt-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
                    <ChapterEditor value={editDraft} onChange={setEditDraft} maxSec={v.durationSec ?? 0} />
                    <button
                      type="button"
                      onClick={() => setChapters.mutate({
                        tutorialId: v.id,
                        chapters: editDraft.filter((c) => c.title.trim()).map((c) => ({ ...c, title: c.title.trim() })),
                      })}
                      disabled={setChapters.isPending}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-40"
                      style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
                    >
                      {setChapters.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      {t("Guardar índice")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Editor del índice (capítulos) ── */
function ChapterEditor({
  value, onChange, maxSec,
}: {
  value: Draft[];
  onChange: (v: Draft[]) => void;
  maxSec: number;
}) {
  const [mm, setMm] = useState("");
  const [ss, setSs] = useState("");
  const [title, setTitle] = useState("");

  function add() {
    const sec = (parseInt(mm || "0", 10) || 0) * 60 + (parseInt(ss || "0", 10) || 0);
    if (!title.trim()) return;
    const next = [...value, { timeSec: sec, title: title.trim() }].sort((a, b) => a.timeSec - b.timeSec);
    onChange(next);
    setMm(""); setSs(""); setTitle("");
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
        {t("Índice del video")}
        {maxSec > 0 && <span className="ml-2 text-[11px]" style={{ color: "var(--color-subtle)" }}>({t("duración")} {fmtTime(maxSec)})</span>}
      </p>

      {value.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {value.map((c, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
              style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
              <span className="shrink-0 text-[11px] tabular-nums" style={{ color: "var(--color-subtle)", fontFamily: "var(--font-mono)" }}>
                {fmtTime(c.timeSec)}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--color-foreground)" }}>{c.title}</span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                title={t("Eliminar")}
                className="shrink-0 transition-opacity hover:opacity-70"
                style={{ color: "var(--color-subtle)" }}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <input
          value={mm} onChange={(e) => setMm(e.target.value.replace(/\D/g, ""))}
          placeholder="min" inputMode="numeric"
          className="w-14 rounded-md px-2 py-1.5 text-center text-xs outline-none"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}
        />
        <span style={{ color: "var(--color-subtle)" }}>:</span>
        <input
          value={ss} onChange={(e) => setSs(e.target.value.replace(/\D/g, "").slice(0, 2))}
          placeholder="seg" inputMode="numeric"
          className="w-14 rounded-md px-2 py-1.5 text-center text-xs outline-none"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", fontFamily: "var(--font-mono)" }}
        />
        <input
          value={title} onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={t("Título del capítulo")}
          className="flex-1 rounded-md px-3 py-1.5 text-xs outline-none"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
        />
        <button
          type="button" onClick={add} disabled={!title.trim()}
          title={t("Agregar capítulo")}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Inputs ── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>
      {children}
      {hint && <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>{hint}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-md px-3 py-2 text-sm outline-none"
      style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
    />
  );
}
