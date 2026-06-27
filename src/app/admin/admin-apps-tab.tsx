"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, Plus, Trash2, Upload, Smartphone, AlertCircle } from "lucide-react";

export function AdminAppsTab() {
  const utils = api.useUtils();
  const appsQ = api.apps.list.useQuery();
  const create = api.apps.create.useMutation({ onSuccess: () => { reset(); void utils.apps.list.invalidate(); } });
  const remove = api.apps.remove.useMutation({ onSuccess: () => void utils.apps.list.invalidate() });

  const [name, setName] = useState("");
  const [badge, setBadge] = useState("TOP");
  const [amount, setAmount] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function reset() { setName(""); setBadge("TOP"); setAmount(""); setImageUrl(null); }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; e.target.value = "";
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string };
      if (data.url) setImageUrl(data.url);
    } catch { /* ignore */ } finally { setUploading(false); }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    create.mutate({ name: name.trim(), badge: badge.trim() || "TOP", amount: parseFloat(amount) || 0, imageUrl: imageUrl ?? undefined });
  }

  const apps = appsQ.data ?? [];

  return (
    <div className="space-y-6">
      {/* Agregar app */}
      <div className="rounded-xl p-6" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
        <div className="mb-1 flex items-center gap-2">
          <Plus className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Agregar app al directorio</h2>
        </div>
        <p className="mb-4 text-[11px]" style={{ color: "var(--color-subtle)" }}>
          Apps sueltas para usar en ofertas sin stack (ej. teststar, empfohlen).
        </p>
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          {/* Imagen */}
          <div className="shrink-0">
            <label className="relative flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-lg" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
              <input type="file" accept="image/*" className="sr-only" onChange={upload} />
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /> : imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              ) : <Upload className="h-5 w-5" style={{ color: "var(--color-subtle)" }} />}
            </label>
          </div>
          <Field label="Nombre" className="min-w-[160px] flex-1">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Coin Master" />
          </Field>
          <Field label="Badge" className="w-24">
            <Input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="TOP" />
          </Field>
          <Field label="Monto" className="w-24">
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="2.50" />
          </Field>
          <button type="submit" disabled={create.isPending || !name.trim()}
            className="inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Agregar
          </button>
          {create.error && (
            <span className="inline-flex w-full items-center gap-1.5 text-xs" style={{ color: "var(--color-error)" }}>
              <AlertCircle className="h-3.5 w-3.5" /> {create.error.message}
            </span>
          )}
        </form>
      </div>

      {/* Directorio */}
      <div className="rounded-xl p-6" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
        <div className="mb-4 flex items-center gap-2">
          <Smartphone className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Directorio</h2>
          <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>{apps.length}</span>
        </div>
        {appsQ.isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
        ) : apps.length === 0 ? (
          <p className="py-4 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>Directorio vacío.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {apps.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
                  {a.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.imageUrl} alt={a.name} className="h-full w-full object-cover" />
                  ) : <span className="text-base">📦</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{a.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>{a.badge} · ${a.amount}</p>
                </div>
                <button type="button" title="Eliminar" disabled={remove.isPending} onClick={() => remove.mutate({ id: a.id })}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md disabled:opacity-50" style={{ color: "var(--color-muted-foreground)" }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <label className="text-[11px] font-medium" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className="h-9 w-full rounded-md px-3 text-sm outline-none"
      style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
  );
}
