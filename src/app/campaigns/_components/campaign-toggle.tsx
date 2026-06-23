"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Pause, Play, Loader2 } from "lucide-react";

export function CampaignToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const toggle = api.campaign.toggleActive.useMutation({
    onSuccess: () => router.refresh(),
  });

  return (
    <Button
      variant="outline"
      size="icon"
      title={isActive ? "Pausar" : "Activar"}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ id, isActive: !isActive })}
    >
      {toggle.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isActive ? (
        <Pause className="h-3.5 w-3.5" />
      ) : (
        <Play className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
