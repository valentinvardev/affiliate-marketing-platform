"use client";

import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Loader2, Shield, ShieldOff } from "lucide-react";

/** Toggle de cloaker por campaña: ON = la landing redirige a una whitepage (ropa). */
export function CampaignCloakToggle({ id, cloak }: { id: string; cloak: boolean }) {
  const router = useRouter();
  const toggle = api.campaign.toggleCloak.useMutation({ onSuccess: () => router.refresh() });

  return (
    <button
      type="button"
      title={cloak ? "Cloaker ACTIVO — la landing redirige a ropa. Click para apagar." : "Cloaker apagado — la landing se muestra normal. Click para activar."}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate({ id, cloak: !cloak })}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:opacity-80 disabled:opacity-40"
      style={{ color: cloak ? "var(--color-warning)" : "var(--color-muted-foreground)" }}
    >
      {toggle.isPending
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : cloak
          ? <Shield className="h-3.5 w-3.5" />
          : <ShieldOff className="h-3.5 w-3.5" />}
    </button>
  );
}
