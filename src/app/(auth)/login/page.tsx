"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered") === "1";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Credenciales incorrectas o cuenta pendiente de aprobación.");
    } else {
      router.push("/campaigns");
      router.refresh();
    }
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
        Iniciar sesión
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
        Ingresá con tu usuario y contraseña.
      </p>

      {registered && (
        <div
          className="mb-4 rounded-lg px-4 py-3 text-sm"
          style={{ background: "rgba(80,227,194,0.08)", border: "1px solid rgba(80,227,194,0.3)", color: "var(--color-success)" }}
        >
          Cuenta creada. Esperá que el admin la apruebe para poder ingresar.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
            Usuario
          </label>
          <AuthInput
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Valentin"
            autoComplete="username"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
            Contraseña
          </label>
          <div className="relative">
            <AuthInput
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
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
          Entrar
        </button>

        <p className="text-center text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="underline hover:opacity-70" style={{ color: "var(--color-foreground)" }}>
            Registrarse
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
