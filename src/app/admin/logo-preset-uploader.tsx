"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { createLogoPreset } from "./actions";

export function LogoPresetUploader() {
  const [name, setName]         = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]   = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = (await res.json()) as { url?: string };
    if (data.url) { setImageUrl(data.url); setPreview(data.url); }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !imageUrl) return;
    const fd = new FormData();
    fd.append("name", name);
    fd.append("imageUrl", imageUrl);
    await createLogoPreset(fd);
    setName(""); setImageUrl(""); setPreview("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl"
          style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-muted-foreground)" }} />
          ) : preview ? (
            <img src={preview} alt="" className="h-full w-full object-contain p-2" />
          ) : (
            <Upload className="h-6 w-6" style={{ color: "var(--color-subtle)" }} />
          )}
        </div>

        <label
          className="inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
        >
          <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
          {uploading ? "Subiendo…" : "Subir imagen"}
        </label>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Nombre del preset</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="App Name Logo"
          required
          className="w-full rounded-md px-3 py-2 text-sm outline-none"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
        />
      </div>

      <button
        type="submit"
        disabled={!name || !imageUrl || uploading}
        className="rounded-md px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-40"
        style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
      >
        Guardar preset
      </button>
    </form>
  );
}
