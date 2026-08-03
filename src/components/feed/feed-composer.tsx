"use client";

import { useRef, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { Send, Loader2, Paperclip, X, Images, ChevronDown } from "lucide-react";
import { api } from "@/trpc/react";
import { LOCALES } from "@/lib/locales";
import { t } from "@/lib/i18n-client";

type Up = { url: string; name: string };

async function uploadImage(file: File): Promise<Up> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? `HTTP ${res.status}`);
  return { url: data.url, name: file.name };
}

/** Caja de publicación: solo la ve el admin. */
export function FeedComposer() {
  const utils = api.useUtils();
  const create = api.feed.create.useMutation({
    onSuccess: async () => { reset(); await utils.feed.list.invalidate(); },
  });

  const [body, setBody] = useState("");
  const [country, setCountry] = useState("");
  const [desc, setDesc] = useState("");
  const [attachment, setAttachment] = useState<Up | null>(null);
  const [slides, setSlides] = useState<Up[]>([]);
  const [busy, setBusy] = useState<null | "attachment" | "slides">(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const attRef = useRef<HTMLInputElement>(null);
  const slideRef = useRef<HTMLInputElement>(null);

  function reset() {
    setBody(""); setCountry(""); setDesc("");
    setAttachment(null); setSlides([]); setErr(null); setOpen(false);
    if (attRef.current) attRef.current.value = "";
    if (slideRef.current) slideRef.current.value = "";
  }

  async function pickAttachment(f: File | null) {
    if (!f) return;
    setErr(null); setBusy("attachment");
    try { setAttachment(await uploadImage(f)); }
    catch (e) { setErr(e instanceof Error ? e.message : t("Falló la subida")); }
    finally { setBusy(null); }
  }

  async function pickSlides(files: FileList | null) {
    // Materializar antes de limpiar el input: si no, la lista queda vacía.
    const chosen = Array.from(files ?? []);
    if (!chosen.length) return;
    setErr(null); setBusy("slides");
    try {
      const ups: Up[] = [];
      for (const f of chosen) ups.push(await uploadImage(f));
      setSlides((s) => [...s, ...ups]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Falló la subida"));
    } finally {
      setBusy(null);
      if (slideRef.current) slideRef.current.value = "";
    }
  }

  function submit() {
    if (!body.trim() || create.isPending || busy) return;
    create.mutate({
      body: body.trim(),
      countryCode: country || null,
      description: desc.trim() || null,
      attachmentUrl: attachment?.url ?? null,
      attachmentName: attachment?.name ?? null,
      slides: slides.map((s) => ({ url: s.url, caption: null })),
    });
  }

  return (
    <div className="mb-4 rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onFocus={() => setOpen(true)}
        rows={open ? 3 : 2}
        placeholder={t("Compartí un ángulo con el equipo…")}
        className="w-full resize-y bg-transparent text-sm outline-none"
        style={{ color: "var(--color-foreground)" }}
      />

      {open && (
        <div className="enter-down mt-3 space-y-3">
          {/* País */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium" style={{ color: "var(--color-muted-foreground)" }}>{t("País del ángulo")}</span>
            <div className="relative">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="appearance-none rounded-md py-1.5 pl-2.5 pr-7 text-xs outline-none"
                style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              >
                <option value="">{t("— ninguna —")}</option>
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.countryCode} style={{ background: "var(--color-surface-raised)" }}>
                    {l.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2" style={{ color: "var(--color-subtle)" }} />
            </div>
            {country && <ReactCountryFlag countryCode={country} svg style={{ width: "1.3em", height: "1em", borderRadius: 2 }} />}
          </div>

          {/* Descripción del ángulo (va en el modal) */}
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder={t("Descripción del ángulo (se ve al abrirlo)…")}
            className="w-full resize-y rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
          />

          {/* Adjunto */}
          {attachment && (
            <div className="relative overflow-hidden rounded-lg" style={{ border: "1px solid var(--color-border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachment.url} alt="" className="w-full object-cover" style={{ maxHeight: 200 }} />
              <button type="button" onClick={() => setAttachment(null)} title={t("Quitar")}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Diapositivas */}
          {slides.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {slides.map((s, i) => (
                <div key={s.url} className="relative h-16 w-16 overflow-hidden rounded-md" style={{ border: "1px solid var(--color-border)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt="" className="h-full w-full object-cover" />
                  <span className="absolute bottom-0 left-0 px-1 text-[9px] font-bold" style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>{i + 1}</span>
                  <button type="button" onClick={() => setSlides((v) => v.filter((_, j) => j !== i))} title={t("Quitar")}
                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full"
                    style={{ background: "rgba(0,0,0,0.75)", color: "#fff" }}>
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {err && <p className="rounded-md px-3 py-2 text-xs" style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}>{err}</p>}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
          <input ref={attRef} type="file" accept="image/*" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0] ?? null; e.target.value = ""; void pickAttachment(f); }} />
          {busy === "attachment" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
          {t("Adjunto")}
        </label>

        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>
          <input ref={slideRef} type="file" accept="image/*" multiple className="sr-only"
            onChange={(e) => { const fl = e.target.files; void pickSlides(fl); }} />
          {busy === "slides" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Images className="h-3.5 w-3.5" />}
          {t("Diapositivas")}
          {slides.length > 0 && <span className="tabular-nums">({slides.length})</span>}
        </label>

        <div className="flex-1" />

        <button
          type="button"
          onClick={submit}
          disabled={!body.trim() || create.isPending || !!busy}
          className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {t("Publicar")}
        </button>
      </div>
    </div>
  );
}
