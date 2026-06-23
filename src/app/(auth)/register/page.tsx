"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al registrarse.");
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
        Crear cuenta
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
        El admin deberá aprobar tu cuenta antes de que puedas acceder.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
            Usuario <span style={{ color: "var(--color-subtle)" }}>(solo letras, números y _)</span>
          </label>
          <AuthInput
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="mi_usuario"
            autoComplete="username"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
            Email <span style={{ color: "var(--color-subtle)" }}>(opcional)</span>
          </label>
          <AuthInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
            Contraseña <span style={{ color: "var(--color-subtle)" }}>(mín. 6 caracteres)</span>
          </label>
          <div className="relative">
            <AuthInput
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-subtle)" }}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
            Confirmar contraseña
          </label>
          <AuthInput
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
        </div>

        {error && (
          <p className="text-xs" style={{ color: "var(--color-error)" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Crear cuenta
        </button>

        <p className="text-center text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="underline hover:opacity-70" style={{ color: "var(--color-foreground)" }}>
            Iniciar sesión
          </Link>
        </p>
      </form>
    </>
  );
}

function AuthInput({
  style: extraStyle,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
      style={{
        background: "var(--color-surface-overlay)",
        border: `1px solid ${focused ? "var(--color-border-focus)" : "var(--color-border)"}`,
        color: "var(--color-foreground)",
        ...extraStyle,
      }}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}
