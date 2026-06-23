"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export function CampaignDelete({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const del = api.campaign.delete.useMutation({
    onSuccess: () => router.refresh(),
  });

  function handleDelete() {
    if (!confirm(`¿Eliminar la campaña "${name}"? Esta acción no se puede deshacer.`)) return;
    del.mutate({ id });
  }

  return (
    <Button
      variant="outline"
      size="icon"
      title="Eliminar"
      disabled={del.isPending}
      onClick={handleDelete}
      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
    >
      {del.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
