"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { Avatar } from "@/components/ui/avatar";
import { t } from "@/lib/i18n-client";

/**
 * Avatar clicable que abre el selector de archivo y sube la foto de perfil.
 * Reusa /api/upload (mismo circuito y validación que el resto de imágenes).
 */
export function AvatarUploader({ name, size = 28 }: { name: string; size?: number }) {
  const utils = api.useUtils();
  const me = api.account.me.useQuery();
  const setAvatar = api.account.setAvatar.useMutation({
    onSuccess: async () => { await utils.account.me.invalidate(); },
  });

  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pick(file: File | null) {
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? `HTTP ${res.status}`);
      await setAvatar.mutateAsync({ url: data.url });
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("Falló la subida"));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <label
      className="group relative shrink-0 cursor-pointer"
      title={err ?? t("Cambiar foto de perfil")}
      style={{ width: size, height: size, display: "inline-block" }}
    >
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0] ?? null; void pick(f); }}
      />
      <Avatar name={name} url={me.data?.avatarUrl} size={size} />
      <span
        className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: "rgba(0,0,0,0.55)", color: "#fff", opacity: busy ? 1 : undefined }}
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
      </span>
    </label>
  );
}
