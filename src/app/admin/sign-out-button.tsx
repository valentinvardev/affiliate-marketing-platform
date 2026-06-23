"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
      style={{
        border: "1px solid var(--color-border)",
        color: "var(--color-muted-foreground)",
        background: "var(--color-surface-overlay)",
      }}
    >
      <LogOut className="h-3.5 w-3.5" />
      Salir
    </button>
  );
}
