"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Check, Camera, X } from "lucide-react";
import { api } from "@/trpc/react";
import { Avatar } from "@/components/ui/avatar";
import { t } from "@/lib/i18n-client";

/** Identidad de la IA del chat y del asistente: nombre, foto y personalidad. */
export function AdminIaTab() {
  const utils = api.useUtils();
  const q = api.config.iaIdentity.useQuery();
  const save = api.config.setIaIdentity.useMutation({
    onSuccess: async () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await utils.config.iaIdentity.invalidate();
    },
  });

  const [name, setName] = useState("");
  const [persona, setPersona] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sembrar el formulario cuando llega la config guardada.
  useEffect(() => {
    if (!q.data) return;
    setName(q.data.name);
    setPersona(q.data.persona);
    setAvatar(q.data.avatar);
  }, [q.data]);

  async function pickAvatar(file: File | null) {
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? `HTTP ${res.status}`);
      setAvatar(data.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Falló la subida"));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="mb-1 flex items-center gap-2">
        <Bot className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{t("Identidad de la IA")}</h2>
      </div>
      <p className="mb-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        {t("Se usa en el chat global (comando /ia) y en el asistente. El nombre se aplica también a los mensajes ya enviados.")}
      </p>

      <div className="space-y-4">
        {/* Foto */}
        <div className="flex items-center gap-3">
          <label className="group relative cursor-pointer" style={{ width: 56, height: 56 }} title={t("Foto del bot")}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => void pickAvatar(e.target.files?.[0] ?? null)}
            />
            <Avatar name={name || "IA"} url={avatar} size={56} />
            <span
              className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              style={{ background: "rgba(0,0,0,0.55)", color: "#fff", opacity: busy ? 1 : undefined }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </span>
          </label>
          {avatar && (
            <button
              type="button"
              onClick={() => setAvatar(null)}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-opacity hover:opacity-80"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}
            >
              <X className="h-3 w-3" /> {t("Quitar")}
            </button>
          )}
        </div>

        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>{t("Nombre del bot")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="IA"
            className="w-full rounded-md px-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
          />
        </div>

        {/* Personalidad */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>{t("Personalidad")}</label>
          <textarea
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder={t("Cómo habla, qué sabe, qué tono usa…")}
            className="w-full resize-y rounded-md px-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
          />
          <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
            {t("Se antepone a sus instrucciones. Las reglas de seguridad del chat grupal se mantienen igual.")}
          </p>
        </div>

        {err && <p className="rounded-md px-3 py-2 text-xs" style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}>{err}</p>}

        <button
          type="button"
          onClick={() => save.mutate({ name: name.trim() || "IA", avatar, persona: persona.trim() })}
          disabled={save.isPending || busy}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {saved ? t("Guardado ✓") : t("Guardar")}
        </button>
      </div>
    </div>
  );
}
