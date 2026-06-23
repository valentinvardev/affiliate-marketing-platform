"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CampaignCopyUrl({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const url = `${window.location.origin}/api/config/${slug}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      title="Copiar URL de config"
      onClick={copy}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
      style={{ color: copied ? "var(--color-success)" : "var(--color-muted-foreground)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface-overlay)"; (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = copied ? "var(--color-success)" : "var(--color-muted-foreground)"; }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
