"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { api } from "@/trpc/react";
import { X, Download, Save, Plus, Trash2, Loader2, Type, Smile, Sparkles, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

type Align = "left" | "center" | "right";
// xPct/yPct = centro del bloque de texto (0-100). size = fracción del ancho de la imagen.
// wPct = ancho máximo del cuadro (para el wrap), fracción del ancho de la imagen.
type Layer = { id: string; text: string; xPct: number; yPct: number; size: number; wPct: number; color: string; align: Align };

const EMOJIS = ["🔥", "✨", "💰", "🤑", "👀", "🎮", "📲", "✅", "😱", "🤔", "💸", "🙌", "👇", "❤️", "😮", "🥳", "💵", "⭐"];
const WEIGHT = 500;          // peso de TikTok Sans
const STROKE_RATIO = 0.18;   // grosor del borde como fracción del tamaño de fuente (subilo/bajalo acá)
const PREVIEW_W = 720;       // resolución del canvas de preview (se escala por CSS)
const FONT_STACK = `${WEIGHT} __PX__px "TikTok Sans", "Satoshi", system-ui, sans-serif`;

const EMOJI_RE = /\p{Extended_Pictographic}/u;
const emojiCache = new Map<string, HTMLImageElement | null>();
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function graphemes(s: string): string[] {
  try {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return [...seg.segment(s)].map((x) => x.segment);
  } catch { return [...s]; }
}

const APPLE_BASE = "https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64";
const appleEmojiUrl = (code: string) => `${APPLE_BASE}/${code}.png`;
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
async function ensureEmojis(layers: Layer[]) {
  const needed = new Set<string>();
  for (const l of layers) for (const g of graphemes(l.text)) if (EMOJI_RE.test(g)) needed.add(g);
  const missing = [...needed].filter((g) => !emojiCache.has(g));
  if (missing.length) await Promise.all(missing.map((g) => loadEmoji(g)));
}
async function ensureFont(layers: Layer[]) {
  try {
    await Promise.all(layers.map((l) => document.fonts.load(FONT_STACK.replace("__PX__", "40"), l.text || "A")));
    await document.fonts.ready;
  } catch { /* ignore */ }
}

// Corta el texto en líneas que entran en un ancho máximo (corta palabras largas por grafema).
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, fontPx: number): string[] {
  const widthOf = (str: string) => graphemes(str).reduce((a, g) => a + (EMOJI_RE.test(g) ? fontPx : ctx.measureText(g).width), 0);
  const out: string[] = [];
  for (const para of text.split("\n")) {
    if (para === "") { out.push(""); continue; }
    let line = "";
    for (const word of para.split(" ")) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && widthOf(candidate) > maxW) { out.push(line); line = word; }
      else line = candidate;
      while (widthOf(line) > maxW && graphemes(line).length > 1) {
        const gs = graphemes(line);
        let fit = gs[0]!; let i = 1;
        for (; i < gs.length; i++) { if (widthOf(fit + gs[i]) > maxW) break; fit += gs[i]; }
        out.push(fit); line = gs.slice(i).join("");
      }
    }
    out.push(line);
  }
  return out;
}

type Geo = { fontPx: number; lines: string[]; lineWidths: number[]; actualW: number; lineH: number; blockH: number; left: number; top: number };
function layoutLayer(ctx: CanvasRenderingContext2D, l: Layer, W: number, H: number): Geo {
  const fontPx = l.size * W;
  ctx.font = FONT_STACK.replace("__PX__", String(fontPx));
  const maxW = Math.max(fontPx * 0.5, l.wPct * W);
  const lines = wrapLines(ctx, l.text, maxW, fontPx);
  const widthOf = (str: string) => graphemes(str).reduce((a, g) => a + (EMOJI_RE.test(g) ? fontPx : ctx.measureText(g).width), 0);
  const lineWidths = lines.map(widthOf);
  const actualW = Math.max(fontPx * 0.3, ...lineWidths, 0);
  const lineH = fontPx * 1.2;
  const blockH = Math.max(lineH, lines.length * lineH);
  const cx = (l.xPct / 100) * W, cy = (l.yPct / 100) * H;
  return { fontPx, lines, lineWidths, actualW, lineH, blockH, left: cx - actualW / 2, top: cy - blockH / 2 };
}
function drawLayer(ctx: CanvasRenderingContext2D, l: Layer, geo: Geo) {
  const { fontPx, lines, lineWidths, actualW, lineH, left, top } = geo;
  ctx.font = FONT_STACK.replace("__PX__", String(fontPx));
  ctx.textBaseline = "top"; ctx.lineJoin = "round"; ctx.miterLimit = 2;
  const sw = Math.max(2, fontPx * STROKE_RATIO);
  let y = top;
  lines.forEach((line, li) => {
    const total = lineWidths[li]!;
    let x = l.align === "center" ? left + actualW / 2 - total / 2 : l.align === "right" ? left + actualW - total : left;
    for (const g of graphemes(line)) {
      const gw = EMOJI_RE.test(g) ? fontPx : ctx.measureText(g).width;
      if (EMOJI_RE.test(g)) {
        const im = emojiCache.get(g);
        if (im) ctx.drawImage(im, x, y, fontPx, fontPx);
        else { ctx.fillStyle = l.color; ctx.fillText(g, x, y); }
      } else {
        ctx.lineWidth = sw; ctx.strokeStyle = "#000"; ctx.strokeText(g, x, y);
        ctx.fillStyle = l.color; ctx.fillText(g, x, y);
      }
      x += gw;
    }
    y += lineH;
  });
}
// Dibuja escena completa en el canvas y devuelve las cajas (fracciones 0-1) para el overlay.
type Box = { left: number; top: number; w: number; h: number };
function renderScene(canvas: HTMLCanvasElement, img: HTMLImageElement, layers: Layer[], renderW: number): Record<string, Box> {
  const scale = renderW / img.naturalWidth;
  const W = Math.round(renderW), H = Math.round(img.naturalHeight * scale);
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d"); if (!ctx) return {};
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0, W, H);
  const boxes: Record<string, Box> = {};
  for (const l of layers) {
    const geo = layoutLayer(ctx, l, W, H);
    drawLayer(ctx, l, geo);
    boxes[l.id] = { left: geo.left / W, top: geo.top / H, w: geo.actualW / W, h: geo.blockH / H };
  }
  return boxes;
}

let uid = 0;
const newLayer = (yPct: number): Layer => ({ id: `l${++uid}`, text: "Tu texto acá", xPct: 50, yPct, size: 0.08, wPct: 0.8, color: "#ffffff", align: "center" });

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
    if (presets?.hook[0]) first.text = presets.hook[0];
    return [first];
  });
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState<"" | "dl" | "save">("");
  const [boxes, setBoxes] = useState<Record<string, Box>>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: "move" | "scale" | "width"; id: string; sx: number; sy: number; x0: number; y0: number; size0: number; cxC: number; cyC: number; d0: number } | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const selLayer = layers.find((l) => l.id === sel) ?? null;
  const patch = (id: string, p: Partial<Layer>) => setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, ...p } : l)));

  // Redibuja el preview (mismo motor que el export) cuando cambian capas o imagen.
  const redraw = useCallback(async () => {
    const canvas = canvasRef.current; if (!canvas || !img) return;
    await ensureFont(layers);
    await ensureEmojis(layers);
    if (!canvasRef.current) return;
    const b = renderScene(canvas, img, layers, Math.min(img.naturalWidth, PREVIEW_W));
    setBoxes(b);
  }, [img, layers]);
  useEffect(() => { void redraw(); }, [redraw]);

  function pickBg(url: string, s: "hook" | "proof") {
    setSlot(s); setBgUrl(url);
    const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => setImg(i); i.src = url;
  }

  function insertPreset(text: string) {
    if (sel) { patch(sel, { text }); return; }
    if (layers.length < 2) {
      const nl = newLayer(layers.length === 0 ? 30 : 65); nl.text = text;
      setLayers((ls) => [...ls, nl]); setSel(nl.id);
    } else {
      const last = layers[layers.length - 1]!; patch(last.id, { text }); setSel(last.id);
    }
  }

  function startMove(e: React.PointerEvent, id: string) {
    e.stopPropagation(); setSel(id);
    const l = layers.find((x) => x.id === id); if (!l) return;
    drag.current = { mode: "move", id, sx: e.clientX, sy: e.clientY, x0: l.xPct, y0: l.yPct, size0: l.size, cxC: 0, cyC: 0, d0: 1 };
    wrapRef.current?.setPointerCapture?.(e.pointerId);
  }
  function startHandle(e: React.PointerEvent, id: string, mode: "scale" | "width") {
    e.stopPropagation(); setSel(id);
    const l = layers.find((x) => x.id === id); const rect = wrapRef.current?.getBoundingClientRect(); const box = boxes[id];
    if (!l || !rect || !box) return;
    const cxC = rect.left + (box.left + box.w / 2) * rect.width;
    const cyC = rect.top + (box.top + box.h / 2) * rect.height;
    drag.current = { mode, id, sx: e.clientX, sy: e.clientY, x0: l.xPct, y0: l.yPct, size0: l.size, cxC, cyC, d0: Math.hypot(e.clientX - cxC, e.clientY - cyC) || 1 };
    wrapRef.current?.setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    const d = drag.current; const rect = wrapRef.current?.getBoundingClientRect(); if (!d || !rect) return;
    if (d.mode === "move") {
      const dx = ((e.clientX - d.sx) / rect.width) * 100;
      const dy = ((e.clientY - d.sy) / rect.height) * 100;
      patch(d.id, { xPct: clamp(d.x0 + dx, 0, 100), yPct: clamp(d.y0 + dy, 0, 100) });
    } else if (d.mode === "scale") {
      const dist = Math.hypot(e.clientX - d.cxC, e.clientY - d.cyC);
      patch(d.id, { size: clamp(d.size0 * (dist / d.d0), 0.02, 0.5) });
    } else if (d.mode === "width") {
      const cxFrac = (d.cxC - rect.left) / rect.width;
      const fracX = (e.clientX - rect.left) / rect.width;
      patch(d.id, { wPct: clamp(Math.abs(fracX - cxFrac) * 2, 0.12, 1.5) });
    }
  }
  const onUp = () => { drag.current = null; };

  async function render(): Promise<Blob | null> {
    if (!img) return null;
    await ensureFont(layers);
    await ensureEmojis(layers);
    const canvas = document.createElement("canvas");
    renderScene(canvas, img, layers, img.naturalWidth);
    return await new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
  }
  async function download() {
    setBusy("dl");
    try {
      const blob = await render(); if (!blob) return;
      const file = new File([blob], "creativo.png", { type: "image/png" });
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
        {/* Preview (mismo canvas que el export) */}
        <div className="flex flex-1 items-start justify-center">
          <div ref={wrapRef} onPointerMove={onMove} onPointerUp={onUp} onPointerDown={() => setSel(null)}
            className="relative w-full max-w-[340px] select-none" style={{ touchAction: "none" }}>
            {img ? (
              <canvas ref={canvasRef} className="block w-full rounded-xl" style={{ background: "#111", height: "auto", aspectRatio: `${img.naturalWidth}/${img.naturalHeight}` }} />
            ) : (
              <div className="flex items-center justify-center rounded-xl text-xs" style={{ aspectRatio: "9/16", background: "#111", color: "var(--color-subtle)" }}>Elegí una imagen abajo</div>
            )}
            {img && layers.map((l) => {
              const box = boxes[l.id]; if (!box) return null;
              const isSel = sel === l.id;
              return (
                <div key={l.id} onPointerDown={(e) => startMove(e, l.id)}
                  style={{
                    position: "absolute", left: `${box.left * 100}%`, top: `${box.top * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%`,
                    cursor: "move", touchAction: "none",
                    outline: isSel ? "1.5px solid var(--color-success)" : "1px dashed rgba(255,255,255,0.28)",
                  }}>
                  {isSel && (
                    <>
                      <span onPointerDown={(e) => startHandle(e, l.id, "width")} title="Ancho"
                        style={{ position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, borderRadius: 3, background: "var(--color-success)", border: "1.5px solid #000", cursor: "ew-resize" }} />
                      <span onPointerDown={(e) => startHandle(e, l.id, "scale")} title="Tamaño"
                        style={{ position: "absolute", right: -7, bottom: -7, width: 13, height: 13, borderRadius: 3, background: "var(--color-success)", border: "1.5px solid #000", cursor: "nwse-resize" }} />
                    </>
                  )}
                </div>
              );
            })}
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
                  <input type="range" min={0.03} max={0.3} step={0.005} value={selLayer.size} onChange={(e) => patch(selLayer.id, { size: parseFloat(e.target.value) })} className="flex-1" title="Tamaño" />
                  <div className="flex gap-0.5">
                    {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Ic]) => (
                      <button key={a} type="button" onClick={() => patch(selLayer.id, { align: a })} className="inline-flex h-7 w-7 items-center justify-center rounded" style={{ background: selLayer.align === a ? "var(--color-surface-overlay)" : "transparent", color: "var(--color-muted-foreground)" }}><Ic className="h-3.5 w-3.5" /></button>
                    ))}
                  </div>
                  {layers.length > 1 && <button type="button" onClick={() => { setLayers((ls) => ls.filter((x) => x.id !== selLayer.id)); setSel(null); }} className="inline-flex h-7 w-7 items-center justify-center rounded" style={{ color: "var(--color-error)" }}><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-[10px]" style={{ color: "var(--color-subtle)" }}>Ancho</span>
                  <input type="range" min={0.12} max={1.5} step={0.02} value={selLayer.wPct} onChange={(e) => patch(selLayer.id, { wPct: parseFloat(e.target.value) })} className="flex-1" />
                </div>
                <div className="flex flex-wrap gap-1">
                  <span className="mr-1 inline-flex items-center text-[11px]" style={{ color: "var(--color-subtle)" }}><Smile className="mr-1 h-3.5 w-3.5" />Emoji</span>
                  {EMOJIS.map((e) => <button key={e} type="button" onClick={() => patch(selLayer.id, { text: selLayer.text + e })} className="rounded px-1 text-base leading-none hover:opacity-70">{e}</button>)}
                </div>
              </div>
            ) : <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>Tocá un texto para editarlo. Arrastralo para moverlo; usá los tiradores para el tamaño y el ancho.</p>}
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
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--color-subtle)" }}>El preview usa el mismo motor que el export → lo que ves es lo que sale. PNG limpio (sin metadata), emojis Apple.</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
