"use client";

/**
 * Compresión de video en el navegador con ffmpeg.wasm.
 *
 * Decisiones importantes:
 *  - Se carga desde CDN con un <script> inyectado, NO como dependencia npm:
 *    el deploy corre `npm run build` sin `npm install`, así que un paquete
 *    nuevo rompería el build en el VPS.
 *  - Core MONO-HILO a propósito. El multi-hilo necesita SharedArrayBuffer, que
 *    exige headers COOP/COEP en la página; eso bloquearía los recursos
 *    cross-origin del panel (imágenes de Supabase y de TapRain). Es más lento,
 *    pero no rompe nada.
 */

const FFMPEG_JS = "https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js";
const CORE_JS = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js";
const CORE_WASM = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm";

/** Arriba de esto el navegador se suele quedar sin memoria al cargar el archivo en el FS virtual. */
export const SAFE_INPUT_BYTES = 500 * 1024 * 1024;

type ProgressEvent = { progress: number; time: number };
type FFmpegInstance = {
  loaded: boolean;
  load: (opts: { coreURL: string; wasmURL: string }) => Promise<void>;
  on: (event: "progress" | "log", cb: (e: never) => void) => void;
  writeFile: (name: string, data: Uint8Array) => Promise<void>;
  readFile: (name: string) => Promise<Uint8Array>;
  deleteFile: (name: string) => Promise<void>;
  exec: (args: string[]) => Promise<number>;
};

let instance: FFmpegInstance | null = null;
let scriptPromise: Promise<void> | null = null;

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-ff="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.dataset.ff = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar el compresor de video"));
    document.head.appendChild(s);
  });
}

/** Carga (una sola vez) el runtime de ffmpeg. `onStage` avisa la fase de descarga. */
export async function loadFfmpeg(onStage?: (s: string) => void): Promise<FFmpegInstance> {
  if (instance?.loaded) return instance;
  onStage?.("script");
  scriptPromise ??= injectScript(FFMPEG_JS);
  await scriptPromise;

  const g = window as unknown as { FFmpegWASM?: { FFmpeg: new () => FFmpegInstance } };
  if (!g.FFmpegWASM) throw new Error("El compresor no quedó disponible");

  instance ??= new g.FFmpegWASM.FFmpeg();
  if (!instance.loaded) {
    onStage?.("core"); // ~32 MB de wasm la primera vez, después queda en caché del navegador
    await instance.load({ coreURL: CORE_JS, wasmURL: CORE_WASM });
  }
  return instance;
}

export type Plan = {
  height: number;
  videoKbps: number;
  audioKbps: number;
  estimatedBytes: number;
  quality: "buena" | "media" | "baja";
};

/**
 * Calcula bitrate y resolución para caer bajo `targetBytes`.
 * El techo de tamaño manda: a más duración, menos bitrate disponible, así que
 * se baja la resolución para que lo poco que hay rinda.
 */
export function planCompression(durationSec: number, targetBytes: number): Plan {
  const usable = targetBytes * 0.92; // margen para el contenedor
  const totalKbps = Math.max(120, Math.floor((usable * 8) / Math.max(durationSec, 1) / 1000));
  const audioKbps = totalKbps < 400 ? 64 : 96;
  const videoKbps = Math.max(80, totalKbps - audioKbps);

  const height = videoKbps >= 900 ? 720 : videoKbps >= 500 ? 540 : videoKbps >= 280 ? 480 : 360;
  const quality: Plan["quality"] = videoKbps >= 900 ? "buena" : videoKbps >= 400 ? "media" : "baja";

  return {
    height,
    videoKbps,
    audioKbps,
    estimatedBytes: Math.round(((videoKbps + audioKbps) * 1000 * durationSec) / 8),
    quality,
  };
}

/** Transcodifica a MP4/H.264 apuntando al plan dado. Devuelve el archivo listo para subir. */
export async function compressVideo(
  file: File,
  plan: Plan,
  onProgress: (pct: number) => void,
  onStage?: (s: string) => void,
): Promise<File> {
  const ff = await loadFfmpeg(onStage);
  onStage?.("encode");

  ff.on("progress", ((e: ProgressEvent) => {
    if (typeof e.progress === "number") {
      onProgress(Math.max(0, Math.min(100, Math.round(e.progress * 100))));
    }
  }) as (e: never) => void);

  const inName = "in" + (/\.[a-z0-9]+$/i.exec(file.name)?.[0] ?? ".mp4");
  const outName = "out.mp4";

  await ff.writeFile(inName, new Uint8Array(await file.arrayBuffer()));
  await ff.exec([
    "-i", inName,
    "-vf", `scale=-2:${plan.height}`,
    "-c:v", "libx264",
    "-b:v", `${plan.videoKbps}k`,
    "-maxrate", `${Math.round(plan.videoKbps * 1.45)}k`,
    "-bufsize", `${plan.videoKbps * 3}k`,
    "-preset", "veryfast", // el core mono-hilo es lento; presets más lentos no compensan acá
    "-profile:v", "main",
    "-pix_fmt", "yuv420p", // sin esto Safari no lo reproduce
    "-c:a", "aac",
    "-b:a", `${plan.audioKbps}k`,
    "-ac", "2",
    "-movflags", "+faststart", // permite empezar a reproducir sin bajar todo
    "-y", outName,
  ]);

  const data = await ff.readFile(outName);
  // Liberar el FS virtual: si no, una segunda compresión arranca sin memoria.
  await ff.deleteFile(inName).catch(() => undefined);
  await ff.deleteFile(outName).catch(() => undefined);

  const base = file.name.replace(/\.[^.]+$/, "");
  const buf = new Uint8Array(data).slice().buffer as ArrayBuffer;
  return new File([buf], `${base}-comprimido.mp4`, { type: "video/mp4" });
}
