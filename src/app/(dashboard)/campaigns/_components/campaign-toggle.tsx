"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, Pause, Play } from "lucide-react";

export function CampaignToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const toggle = api.campaign.toggleActive.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <button
      title={isActive ? "Pausar" : "Activar"}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ id, isActive: !isActive })}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-40"
      style={{ color: "var(--color-muted-foreground)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface-overlay)"; (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--color-muted-foreground)"; }}
    >
      {toggle.isPending
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : isActive
          ? <Pause className="h-3.5 w-3.5" />
          : <Play className="h-3.5 w-3.5" />}
    </button>
  );
}
