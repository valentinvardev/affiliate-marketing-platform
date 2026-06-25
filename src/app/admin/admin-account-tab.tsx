"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, KeyRound, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

export function AdminAccountTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [localErr, setLocalErr] = useState("");

  const change = api.account.changePassword.useMutation({
    onSuccess: () => { setCurrent(""); setNext(""); setConfirm(""); },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setLocalErr("");
    if (next.length < 8) { setLocalErr("La nueva contraseña debe tener al menos 8 caracteres."); return; }
    if (next !== confirm) { setLocalErr("Las contraseñas nuevas no coinciden."); return; }
    change.mutate({ currentPassword: current, newPassword: next });
  }

  const err = localErr || (change.error?.message ?? "");

  return (
    <div className="rounded-xl p-6" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Cambiar mi contraseña</h2>
      </div>

      <form onSubmit={submit} className="max-w-sm space-y-4">
        <Field label="Contraseña actual">
          <PwInput value={current} onChange={setCurrent} show={show} autoComplete="current-password" />
        </Field>
        <Field label="Nueva contraseña (mín. 8)">
          <PwInput value={next} onChange={setNext} show={show} autoComplete="new-password" />
        </Field>
        <Field label="Repetir nueva contraseña">
          <PwInput value={confirm} onChange={setConfirm} show={show} autoComplete="new-password" />
        </Field>

        <label className="flex items-center gap-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          <button type="button" onClick={() => setShow((v) => !v)} className="inline-flex items-center gap-1.5">
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {show ? "Ocultar" : "Mostrar"} contraseñas
          </button>
        </label>

        {err && (
          <p className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-error)" }}>
            <AlertCircle className="h-3.5 w-3.5" /> {err}
          </p>
        )}
        {change.isSuccess && !err && (
          <p className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-success)" }}>
            <Check className="h-3.5 w-3.5" /> Contraseña actualizada.
          </p>
        )}

        <button
          type="submit"
          disabled={change.isPending || !current || !next}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          {change.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Cambiar contraseña
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>
      {children}
    </div>
  );
}

function PwInput({ value, onChange, show, autoComplete }: { value: string; onChange: (v: string) => void; show: boolean; autoComplete: string }) {
  return (
    <input
      type={show ? "text" : "password"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      placeholder="••••••••"
      className="w-full rounded-md px-3 py-2 text-sm outline-none"
      style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
    />
  );
}
