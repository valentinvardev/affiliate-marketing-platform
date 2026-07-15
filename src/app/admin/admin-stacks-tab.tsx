"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Plus, Trash2, ChevronDown, ChevronRight, Check, X, Loader2, Upload, Image as ImageIcon } from "lucide-react";

type Stack = {
  id: string;
  name: string;
  items: StackItem[];
};
type StackItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  tag: string;
  badge: string;
  amount: number;
  position: number;
};

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-md px-3 py-2 text-sm outline-none"
      style={{
        background: "var(--color-surface-overlay)",
        border:     "1px solid var(--color-border)",
        color:      "var(--color-foreground)",
      }}
    />
  );
}

function Btn({
  children, onClick, variant = "ghost", disabled, type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const bg =
    variant === "primary" ? "var(--color-foreground)"      :
    variant === "danger"  ? "rgba(239,68,68,0.12)"         :
    "var(--color-surface-overlay)";
  const color =
    variant === "primary" ? "var(--color-background)"      :
    variant === "danger"  ? "#ef4444"                      :
    "var(--color-muted-foreground)";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity disabled:opacity-40"
      style={{ background: bg, border: "1px solid var(--color-border)", color }}
    >
      {children}
    </button>
  );
}

/* ── Add item form ── */
function AddItemForm({ stackId, onDone }: { stackId: string; onDone: () => void }) {
  const utils = api.useUtils();
  const add = api.stack.addItem.useMutation({
    onSuccess: () => { void utils.stack.list.invalidate(); onDone(); },
  });
  const appsQ = api.apps.list.useQuery();

  const [f, setF] = useState({ name: "", imageUrl: "", tag: "1 hr", badge: "TOP", amount: "" });
  const [uploading, setUploading] = useState(false);

  function pickApp(id: string) {
    const app = appsQ.data?.find((a) => a.id === id);
    if (!app) return;
    setF({
      name:     app.name,
      imageUrl: app.imageUrl ?? "",
      tag:      app.tag ?? "1 hr",
      badge:    app.badge ?? "TOP",
      amount:   app.amount != null ? String(app.amount) : "",
    });
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) setF((p) => ({ ...p, imageUrl: data.url! }));
      }
    } catch { /* silent */ } finally {
      setUploading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name || !f.amount) return;
    add.mutate({
      stackId,
      name:     f.name,
      imageUrl: f.imageUrl || null,
      tag:      f.tag,
      badge:    f.badge,
      amount:   parseFloat(f.amount),
    });
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-2 rounded-lg p-3" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
      <p className="col-span-2 text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-subtle)" }}>
        Nueva aplicación
      </p>
      <label className="col-span-2 flex flex-col gap-1">
        <span className="text-[10px]" style={{ color: "var(--color-subtle)" }}>Elegí de la lista de apps (prellena los campos) o cargá una manual abajo</span>
        <select
          defaultValue=""
          onChange={(e) => { pickApp(e.target.value); }}
          className="w-full rounded-md px-3 py-2 text-sm outline-none"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
        >
          <option value="" style={{ background: "var(--color-surface-raised)" }}>
            {appsQ.isLoading ? "Cargando apps…" : "— Elegí una app —"}
          </option>
          {(appsQ.data ?? []).map((a) => (
            <option key={a.id} value={a.id} style={{ background: "var(--color-surface-raised)" }}>
              {a.name}{a.amount != null ? ` · $${a.amount}` : ""}
            </option>
          ))}
        </select>
      </label>
      <Input placeholder="Nombre (ej: Block Blast)" value={f.name} onChange={(e) => setF(p => ({ ...p, name: e.target.value }))} required />
      <Input placeholder="Monto (ej: 12)" type="number" step="0.01" value={f.amount} onChange={(e) => setF(p => ({ ...p, amount: e.target.value }))} required />
      <Input placeholder="Tag (ej: 1 hr)" value={f.tag} onChange={(e) => setF(p => ({ ...p, tag: e.target.value }))} />
      <Input placeholder="Badge (ej: TOP, HOT)" value={f.badge} onChange={(e) => setF(p => ({ ...p, badge: e.target.value }))} />
      <div className="col-span-2 flex items-center gap-3">
        <div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-muted-foreground)" }} />
          ) : f.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.imageUrl} alt="App" className="h-full w-full object-contain p-1.5" />
              <button
                type="button"
                onClick={() => setF((p) => ({ ...p, imageUrl: "" }))}
                className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full"
                style={{ background: "rgba(0,0,0,0.7)", color: "white" }}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </>
          ) : (
            <ImageIcon className="h-5 w-5" style={{ color: "var(--color-subtle)" }} />
          )}
        </div>
        <label
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
        >
          <input type="file" accept="image/*" className="sr-only" onChange={handleUpload} />
          <Upload className="h-3.5 w-3.5" />
          {f.imageUrl ? "Cambiar imagen" : "Subir imagen"}
        </label>
      </div>
      <div className="col-span-2 flex gap-2">
        <Btn variant="primary" type="submit" disabled={add.isPending}>
          {add.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Agregar
        </Btn>
        <Btn onClick={onDone}>Cancelar</Btn>
      </div>
    </form>
  );
}

/* ── Stack row ── */
function StackRow({ stack }: { stack: Stack }) {
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  const del = api.stack.delete.useMutation({
    onSuccess: () => void utils.stack.list.invalidate(),
  });
  const removeItem = api.stack.removeItem.useMutation({
    onSuccess: () => void utils.stack.list.invalidate(),
  });

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        style={{ background: "var(--color-surface-overlay)" }}
        onClick={() => setOpen(o => !o)}
      >
        {open
          ? <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
          : <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
        }
        <span className="flex-1 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
          {stack.name}
        </span>
        <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>
          {stack.items.length} app{stack.items.length !== 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); del.mutate({ id: stack.id }); }}
          disabled={del.isPending}
          title="Eliminar stack"
          className="ml-2 shrink-0 rounded-md p-1 transition-opacity hover:opacity-70 disabled:opacity-40"
          style={{ color: "var(--color-subtle)" }}
        >
          {del.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Expanded content */}
      {open && (
        <div className="divide-y" style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
          {stack.items.length === 0 && !addingItem && (
            <p className="px-4 py-3 text-xs text-center" style={{ color: "var(--color-subtle)" }}>
              Sin aplicaciones. Agregá la primera.
            </p>
          )}

          {stack.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              {/* Badge */}
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black text-white"
                style={{ background: "var(--color-muted-foreground)", minWidth: 28, textAlign: "center" }}
              >
                {item.badge}
              </span>
              <span className="flex-1 text-sm" style={{ color: "var(--color-foreground)" }}>{item.name}</span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--color-muted-foreground)" }}>
                ${item.amount}
              </span>
              <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>{item.tag}</span>
              <button
                type="button"
                onClick={() => removeItem.mutate({ id: item.id })}
                disabled={removeItem.isPending}
                className="shrink-0 rounded-md p-1 transition-opacity hover:opacity-70 disabled:opacity-40"
                style={{ color: "var(--color-subtle)" }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <div className="px-4 py-3">
            {addingItem ? (
              <AddItemForm stackId={stack.id} onDone={() => setAddingItem(false)} />
            ) : (
              <Btn onClick={() => setAddingItem(true)}>
                <Plus className="h-3 w-3" />
                Agregar aplicación
              </Btn>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export function AdminStacksTab() {
  const { data: stacks = [], isLoading } = api.stack.list.useQuery();
  const utils = api.useUtils();
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const create = api.stack.create.useMutation({
    onSuccess: () => {
      void utils.stack.list.invalidate();
      setNewName("");
      setCreating(false);
    },
  });

  return (
    <div className="space-y-4">
      {/* Create form */}
      <div className="rounded-xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
        <p className="mb-3 text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
          Nuevo stack
        </p>
        {creating ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              placeholder="Nombre del stack (ej: UK Gaming 2025)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) create.mutate({ name: newName.trim() });
                if (e.key === "Escape") setCreating(false);
              }}
            />
            <button
              type="button"
              onClick={() => { if (newName.trim()) create.mutate({ name: newName.trim() }); }}
              disabled={!newName.trim() || create.isPending}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md disabled:opacity-40"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
            >
              {create.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
              style={{ border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <Btn variant="primary" onClick={() => setCreating(true)}>
            <Plus className="h-3 w-3" />
            Crear stack
          </Btn>
        )}
      </div>

      {/* List */}
      <div className="rounded-xl p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
        <div className="mb-3 flex items-center gap-2">
          <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Stacks definidos</p>
          <span className="rounded-full px-2 py-0.5 text-[11px]"
            style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>
            {stacks.length}
          </span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} />
          </div>
        ) : stacks.length === 0 ? (
          <p className="py-4 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Sin stacks todavía. Creá el primero.
          </p>
        ) : (
          <div className="space-y-2">
            {stacks.map((s) => (
              <StackRow key={s.id} stack={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
