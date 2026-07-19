"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Pause, Play } from "lucide-react";

export function CampaignToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  useEffect(() => setActive(isActive), [isActive]);
  const toggle = api.campaign.toggleActive.useMutation({
    onSuccess: () => router.refresh(),
    onError: () => setActive(isActive),
  });

  return (
    <button
      title={active ? "Pausar" : "Activar"}
      onClick={() => { const next = !active; setActive(next); toggle.mutate({ id, isActive: next }); }}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
      style={{ color: "var(--color-muted-foreground)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface-overlay)"; (e.currentTarget as HTMLElement).style.color = "var(--color-foreground)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--color-muted-foreground)"; }}
    >
      {active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
    </button>
  );
}
