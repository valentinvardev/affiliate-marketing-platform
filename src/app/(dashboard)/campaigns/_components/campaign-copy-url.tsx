"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CampaignCopyUrl({ slug, domain }: { slug: string; domain?: string | null }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const url = domain ? `https://${domain}/${slug}` : `${window.location.origin}/landing/${slug}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      title="Copiar link de la landing"
      onClick={copy}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors"
      style={{ color: copied ? "var(--color-success)" : "var(--color-muted-foreground)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface-overlay)"; (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = copied ? "var(--color-success)" : "var(--color-muted-foreground)"; }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
