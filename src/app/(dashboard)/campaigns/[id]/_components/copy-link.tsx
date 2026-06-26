"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon } from "lucide-react";

/** Copia el link público de la campaña (path-based: dominio/slug). */
export function CopyLink({ domain, slug }: { domain: string | null; slug: string }) {
  const [copied, setCopied] = useState(false);

  function url() {
    if (domain) return `https://${domain}/${slug}`;
    if (typeof window !== "undefined") return `${window.location.origin}/landing/${slug}`;
    return `/landing/${slug}`;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard bloqueado */ }
  }

  const shown = domain ? `${domain}/${slug}` : `/${slug}`;

  return (
    <button
      type="button"
      onClick={copy}
      title="Copiar link de la campaña"
      className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors hover:opacity-80"
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-overlay)",
        color: copied ? "var(--color-success)" : "var(--color-muted-foreground)",
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
      <span className="hidden max-w-[180px] truncate font-mono sm:inline">{copied ? "¡Copiado!" : shown}</span>
      {!copied && <Copy className="h-3 w-3 sm:hidden" />}
    </button>
  );
}
