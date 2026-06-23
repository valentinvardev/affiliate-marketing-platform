"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Trash2, Loader2 } from "lucide-react";

export function CampaignDelete({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const del = api.campaign.delete.useMutation({ onSuccess: () => router.refresh() });

  function handleDelete() {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    del.mutate({ id });
  }

  return (
    <button
      title="Eliminar"
      disabled={del.isPending}
      onClick={handleDelete}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-40"
      style={{ color: "var(--color-muted-foreground)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-error-bg)"; (e.currentTarget as HTMLElement).style.color = "var(--color-error)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--color-muted-foreground)"; }}
    >
      {del.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}
