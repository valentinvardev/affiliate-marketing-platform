"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { api } from "@/trpc/react";
import { X, Download, Save, Plus, Trash2, Loader2, Type, Smile, Sparkles, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

type Align = "left" | "center" | "right";
type Layer = { id: string; text: string; xPct: number; yPct: number; size: number; color: string; align: Align };

const EMOJIS = ["🔥", "✨", "💰", "🤑", "👀", "🎮", "📲", "✅", "😱", "🤔", "💸", "🙌", "👇", "❤️", "😮", "🥳", "💵", "⭐"];
const WEIGHT = 500; // peso de TikTok Sans en el creativo
const EMOJI_RE = /\p{Extended_Pictographic}/u;
const emojiCache = new Map<string, HTMLImageElement | null>();
const HOMOGLYPH_MAP: Record<string, string> = {
  a: "а", A: "А", e: "е", E: "Е", i: "і", I: "І", o: "о", O: "О", p: "р", P: "Р", c: "с", C: "С", x: "х", X: "Х", y: "у", Y: "У", t: "т", T: "Т", s: "ѕ", S: "Ѕ",
};

function graphemes(s: string): string[] {
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return [...seg.segment(s)].map((x) => x.segment);
  } catch { return [...s]; }
}
const APPLE_BASE = "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64";
const appleEmojiUrl = (code: string) => `${APPLE_BASE}/${code}.png`;
// El dataset de Apple a veces conserva el fe0f en el nombre (2764-fe0f.png) y a veces
// no. Probamos primero con la secuencia completa y, si 404, sin el fe0f.
function emojiCandidates(g: string): string[] {
  const cps = [...g].map((c) => c.codePointAt(0)!.toString(16));
  const full = cps.join("-");
  const noVs = cps.filter((c) => c !== "fe0f").join("-");
  return full === noVs ? [full] : [full, noVs];
}
function loadEmoji(g: string): Promise<HTMLImageElement | null> {
  if (emojiCache.has(g)) return Promise.resolve(emojiCache.get(g)!);
  const cands = emojiCandidates(g);
  return new Promise((res) => {
    let i = 0;
    const tryNext = () => {
      if (i >= cands.length) { emojiCache.set(g, null); return res(null); }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { emojiCache.set(g, img); res(img); };
      img.onerror = () => { i += 1; tryNext(); };
      img.src = appleEmojiUrl(cands[i]!);
    };
    tryNext();
  });
}
// Preview: renderiza el texto con los PNG de Apple inline (para que coincida con el export).
function EmojiImg({ g }: { g: string }) {
  const cands = emojiCandidates(g);
  const [idx, setIdx] = useState(0);
  if (idx >= cands.length) return <span>{g}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={appleEmojiUrl(cands[idx]!)} alt={g} draggable={false} onError={() => setIdx((i) => i + 1)}
      style={{ height: "1em", width: "1em", display: "inline-block", verticalAlign: "-0.15em" }} />
  );
}
function EmojiText({ text }: { text: string }) {
  return <>{graphemes(text).map((g, i) => (EMOJI_RE.test(g) ? <EmojiImg key={i} g={g} /> : <span key={i}>{g}</span>))}</>;
}

function obfuscateForExport(text: string): string {
  return text.replace(/[aAeEiIoOpPcCxXyYtTsS]/g, (ch) => HOMOGLYPH_MAP[ch] ?? ch);
}

function drawAdversarialNoise(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const clampedW = Math.max(24, Math.min(width, 1200));
  const clampedH = Math.max(24, Math.min(height, 1200));
  const cell = Math.max(2, Math.min(8, Math.floor(Math.min(clampedW, clampedH) / 18)));
  const alphaBase = 0.08;
  for (let yy = 0; yy < clampedH; yy += cell) {
    for (let xx = 0; xx < clampedW; xx += cell) {
      if (Math.random() > 0.55) continue;
      const r = 40 + Math.floor(Math.random() * 50);
      const g = 42 + Math.floor(Math.random() * 55);
      const b = 45 + Math.floor(Math.random() * 45);
      const alpha = alphaBase + Math.random() * 0.12;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fillRect(x + xx, y + yy, cell, cell);
    }
  }
}

let uid = 0;
const newLayer = (yPct: number): Layer => ({ id: `l${++uid}`, text: "Tu texto acá", xPct: 50, yPct, size: 0.08, color: "#ffffff", align: "center" });
const anchorX = (align: Align) => (align === "center" ? "-50%" : align === "right" ? "-100%" : "0%");

export function ImageEditor({ angleId, country, presets, onClose }: { angleId: string; country: string; presets?: { hook: string[]; proof: string[] }; onClose: () => void }) {
  const utils = api.useUtils();
  const hooksQ = api.angles.proofList.useQuery({ country, kind: "hook" });
  const proofsQ = api.angles.proofList.useQuery({ country, kind: "proof" });
  const mediaAdd = api.angles.mediaAdd.useMutation({ onSuccess: () => void utils.angles.mediaList.invalidate() });

  const [slot, setSlot] = useState<"hook" | "proof">("hook");
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [layers, setLayers] = useState<Layer[]>(() => {
    const first = newLayer(30);
    if (presets?.hook[0]) first.text = presets.hook[0]; // hook precargado listo para posicionar
    return [first];
  });
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState<"" | "dl" | "save">("");

  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; sx: number; sy: number; x0: number; y0: number } | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function pickBg(url: string, s: "hook" | "proof") {
    setSlot(s); setBgUrl(url);
    const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => setImg(i); i.src = url;
  }
  const selLayer = layers.find((l) => l.id === sel) ?? null;
  const patch = (id: string, p: Partial<Layer>) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));

  // Coloca un texto del ángulo con un click: usa la capa seleccionada, o crea una nueva.
  function insertPreset(text: string) {
    if (sel) { patch(sel, { text }); return; }
    if (layers.length < 2) {
      const nl = newLayer(layers.length === 0 ? 30 : 65); nl.text = text;
      setLayers((ls) => [...ls, nl]); setSel(nl.id);
    } else {
      const last = layers[layers.length - 1]!; patch(last.id, { text }); setSel(last.id);
    }
  }

  function onDown(e: React.PointerEvent, id: string) {
    e.stopPropagation(); setSel(id);
    const l = layers.find((x) => x.id === id)!;
    drag.current = { id, sx: e.clientX, sy: e.clientY, x0: l.xPct, y0: l.yPct };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current || !boxRef.current) return;
    const r = boxRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.sx) / r.width) * 100;
    const dy = ((e.clientY - drag.current.sy) / r.height) * 100;
    patch(drag.current.id, { xPct: Math.max(0, Math.min(100, drag.current.x0 + dx)), yPct: Math.max(0, Math.min(100, drag.current.y0 + dy)) });
  }
  const onUp = () => { drag.current = null; };

  async function render(): Promise<Blob | null> {
    if (!img) return null;
    const W = img.naturalWidth, H = img.naturalHeight;
    const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d"); if (!ctx) return null;
    // Asegurar que TikTok Sans esté cargada para los textos antes de dibujar.
    try {
      await Promise.all(layers.map((l) => document.fonts.load(`${WEIGHT} 40px "TikTok Sans"`, l.text || "A")));
      await document.fonts.ready;
    } catch { /* ignore */ }
    ctx.drawImage(img, 0, 0, W, H);

    const codes = new Set<string>();
    for (const l of layers) for (const line of l.text.split("\n")) for (const g of graphemes(line)) if (EMOJI_RE.test(g)) codes.add(g);
    const emo = new Map<string, HTMLImageElement | null>();
    await Promise.all([...codes].map(async (g) => emo.set(g, await loadEmoji(g))));

    for (const l of layers) {
      const exportText = obfuscateForExport(l.text);
      const fontPx = l.size * W;
      ctx.font = `${WEIGHT} ${fontPx}px "TikTok Sans", "Satoshi", system-ui, sans-serif`;
      ctx.textBaseline = "top"; ctx.lineJoin = "round"; ctx.miterLimit = 2;
      const sw = Math.max(2, fontPx * 0.10); // borde grueso estilo TikTok (~4px equiv.)
      const lineH = fontPx * 1.2;
      const ax = (l.xPct / 100) * W;
      let y = (l.yPct / 100) * H;
      const lines = exportText.split("\n");
      const lineWidths = lines.map((line) => {
        const gs = graphemes(line);
        const widths = gs.map((g) => (EMOJI_RE.test(g) ? fontPx : ctx.measureText(g).width));
        return widths.reduce((a, b) => a + b, 0);
      });
      const maxWidth = Math.max(...lineWidths, 0);
      const boxW = Math.max(fontPx * 1.2, maxWidth + fontPx * 0.8);
      const boxH = Math.max(fontPx * 1.2, lines.length * lineH + fontPx * 0.3);
      const boxX = l.align === "center" ? ax - boxW / 2 : l.align === "right" ? ax - boxW : ax;
      const boxY = y - fontPx * 0.2;
      drawAdversarialNoise(ctx, Math.round(Math.max(0, boxX - fontPx * 0.1)), Math.round(Math.max(0, boxY - fontPx * 0.1)), Math.round(Math.min(W, boxW + fontPx * 0.2)), Math.round(Math.min(H, boxH + fontPx * 0.2)));
      for (const line of lines) {
        const gs = graphemes(line);
        const widths = gs.map((g) => (EMOJI_RE.test(g) ? fontPx : ctx.measureText(g).width));
        const total = widths.reduce((a, b) => a + b, 0);
        let x = l.align === "center" ? ax - total / 2 : l.align === "right" ? ax - total : ax;
        gs.forEach((g, i) => {
          if (EMOJI_RE.test(g)) {
            const im = emo.get(g);
            if (im) ctx.drawImage(im, x, y, fontPx, fontPx);
            else { ctx.fillStyle = l.color; ctx.fillText(g, x, y); }
          } else {
            ctx.lineWidth = sw; ctx.strokeStyle = "#000"; ctx.strokeText(g, x, y);
            ctx.fillStyle = l.color; ctx.fillText(g, x, y);
          }
          x += widths[i]!;
        });
        y += lineH;
      }
    }
    return await new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
  }

  async function download() {
    setBusy("dl");
    try {
      const blob = await render(); if (!blob) return;
      const file = new File([blob], "creativo.png", { type: "image/png" });
      // iOS: share sheet → "Guardar imagen" (a la galería, sin metadata).
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }).catch(() => {}); }
      else { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = "creativo.png"; a.click(); URL.revokeObjectURL(u); }
    } finally { setBusy(""); }
  }
  async function saveToAngle() {
    setBusy("save");
    try {
      const blob = await render(); if (!blob) return;
      const fd = new FormData(); fd.append("file", new File([blob], "creativo.png", { type: "image/png" }));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) return;
      const { url } = (await res.json()) as { url?: string };
      if (url) await mediaAdd.mutateAsync({ angleId, url, slot });
    } finally { setBusy(""); }
  }

  const thumbs = (slot === "hook" ? hooksQ.data : proofsQ.data) ?? [];

  return createPortal(
    <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(6px)" }}>
      <div className="flex shrink-0 items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Type className="h-4 w-4" style={{ color: "var(--color-foreground)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Editor de creativo · {country}</p>
        <button type="button" title="Editar con Gemini (próximamente)" disabled className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md opacity-40" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}><Sparkles className="h-4 w-4" /></button>
        <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md" style={{ color: "var(--color-subtle)" }}><X className="h-4 w-4" /></button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:flex-row">
        {/* Preview */}
        <div className="flex flex-1 items-start justify-center">
          <div ref={boxRef} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onPointerDown={() => setSel(null)}
            className="relative w-full max-w-[340px] overflow-hidden rounded-xl"
            style={{ aspectRatio: img ? `${img.naturalWidth}/${img.naturalHeight}` : "9/16", background: "#111", containerType: "inline-size" }}>
            {bgUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bgUrl} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
            )}
            {!bgUrl && <div className="flex h-full items-center justify-center text-xs" style={{ color: "var(--color-subtle)" }}>Elegí una imagen abajo</div>}
            {bgUrl && layers.map((l) => (
              <div key={l.id} onPointerDown={(e) => onDown(e, l.id)}
                style={{
                  position: "absolute", left: `${l.xPct}%`, top: `${l.yPct}%`, transform: `translate(${anchorX(l.align)}, -50%)`,
                  fontFamily: '"TikTok Sans","Satoshi",system-ui,sans-serif', fontWeight: WEIGHT, fontSize: `${l.size * 100}cqw`,
                  color: l.color, textAlign: l.align, whiteSpace: "pre", lineHeight: 1.2, cursor: "move", touchAction: "none",
                  WebkitTextStroke: "4px #000", paintOrder: "stroke", userSelect: "none",
                  outline: sel === l.id ? "1px dashed rgba(255,255,255,0.7)" : "none", outlineOffset: 4,
                }}>
                <EmojiText text={l.text} />
              </div>
            ))}
          </div>
        </div>

        {/* Controles */}
        <div className="w-full space-y-4 lg:w-80">
          {/* Fuente de imagen */}
          <div className="rounded-xl p-3" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
            <div className="mb-2 flex gap-1 rounded-md p-0.5" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
              {(["hook", "proof"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setSlot(s)} className="flex-1 rounded px-2 py-1 text-xs font-semibold"
                  style={{ background: slot === s ? "var(--color-foreground)" : "transparent", color: slot === s ? "var(--color-background)" : "var(--color-muted-foreground)" }}>
                  {s === "hook" ? "Imagen 1 (hook)" : "Imagen 2 (proof)"}
                </button>
              ))}
            </div>
            {thumbs.length === 0 ? (
              <p className="py-3 text-center text-[11px]" style={{ color: "var(--color-subtle)" }}>Sin imágenes de {slot} para {country}. Subilas en la página de Ángulos.</p>
            ) : (
              <div className="grid max-h-40 grid-cols-4 gap-1.5 overflow-y-auto">
                {thumbs.map((t) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={t.id} src={t.url} alt="" onClick={() => pickBg(t.url, slot)}
                    className="aspect-[3/4] w-full cursor-pointer rounded object-cover" style={{ border: bgUrl === t.url ? "2px solid var(--color-foreground)" : "1px solid var(--color-border)" }} />
                ))}
              </div>
            )}
          </div>

          {/* Textos del ángulo (un click para colocarlos) */}
          {presets && (
            <div className="rounded-xl p-3" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-subtle)" }}>
                Texto del ángulo · {slot === "hook" ? "hook" : "proof"}
              </p>
              <div className="flex flex-col gap-1.5">
                {(slot === "hook" ? presets.hook : presets.proof).map((t, i) => (
                  <button key={i} type="button" onClick={() => insertPreset(t)}
                    className="rounded-md px-2.5 py-1.5 text-left text-[11px] leading-snug transition-colors hover:opacity-80"
                    style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
                    {t}
                  </button>
                ))}
                {(slot === "hook" ? presets.hook : presets.proof).length === 0 && (
                  <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>Sin texto para este slot.</p>
                )}
              </div>
            </div>
          )}

          {/* Capa seleccionada */}
          <div className="rounded-xl p-3" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
            <div className="mb-2 flex items-center gap-1.5">
              {layers.map((l, i) => (
                <button key={l.id} type="button" onClick={() => setSel(l.id)} className="rounded px-2 py-1 text-[11px] font-medium"
                  style={{ background: sel === l.id ? "var(--color-surface-overlay)" : "transparent", border: `1px solid ${sel === l.id ? "var(--color-border-focus)" : "var(--color-border)"}`, color: "var(--color-foreground)" }}>Texto {i + 1}</button>
              ))}
              {layers.length < 2 && <button type="button" onClick={() => { const nl = newLayer(65); setLayers((ls) => [...ls, nl]); setSel(nl.id); }} className="inline-flex h-6 w-6 items-center justify-center rounded" style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}><Plus className="h-3.5 w-3.5" /></button>}
            </div>
            {selLayer ? (
              <div className="space-y-2">
                <textarea value={selLayer.text} onChange={(e) => patch(selLayer.id, { text: e.target.value })} rows={2}
                  className="w-full resize-y rounded-md px-2.5 py-1.5 text-sm outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
                <div className="flex items-center gap-2">
                  <input type="color" value={selLayer.color} onChange={(e) => patch(selLayer.id, { color: e.target.value })} className="h-7 w-8 cursor-pointer rounded" style={{ border: "1px solid var(--color-border)", background: "transparent" }} />
                  <input type="range" min={0.03} max={0.2} step={0.005} value={selLayer.size} onChange={(e) => patch(selLayer.id, { size: parseFloat(e.target.value) })} className="flex-1" />
                  <div className="flex gap-0.5">
                    {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Ic]) => (
                      <button key={a} type="button" onClick={() => patch(selLayer.id, { align: a })} className="inline-flex h-7 w-7 items-center justify-center rounded" style={{ background: selLayer.align === a ? "var(--color-surface-overlay)" : "transparent", color: "var(--color-muted-foreground)" }}><Ic className="h-3.5 w-3.5" /></button>
                    ))}
                  </div>
                  {layers.length > 1 && <button type="button" onClick={() => { setLayers((ls) => ls.filter((x) => x.id !== selLayer.id)); setSel(null); }} className="inline-flex h-7 w-7 items-center justify-center rounded" style={{ color: "var(--color-error)" }}><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="mr-1 inline-flex items-center text-[11px]" style={{ color: "var(--color-subtle)" }}><Smile className="mr-1 h-3.5 w-3.5" />Emoji</span>
                  {EMOJIS.map((e) => <button key={e} type="button" onClick={() => patch(selLayer.id, { text: selLayer.text + e })} className="rounded px-1 text-base leading-none hover:opacity-70">{e}</button>)}
                </div>
              </div>
            ) : <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>Tocá un texto para editarlo.</p>}
          </div>

          {/* Export */}
          <div className="flex gap-2">
            <button type="button" disabled={!img || !!busy} onClick={download}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
              {busy === "dl" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Guardar a galería
            </button>
            <button type="button" disabled={!img || !!busy} onClick={saveToAngle}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
              {busy === "save" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar al ángulo
            </button>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-subtle)" }}>El export es PNG limpio (sin metadata). Los emojis se hornean en estilo Apple.</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
