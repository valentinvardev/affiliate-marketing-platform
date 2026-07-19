"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Shield, ShieldOff } from "lucide-react";

/** Toggle de cloaker por campaña (optimista): ON = la landing redirige a una whitepage (ropa). */
export function CampaignCloakToggle({ id, cloak }: { id: string; cloak: boolean }) {
  const [on, setOn] = useState(cloak);
  useEffect(() => setOn(cloak), [cloak]);
  const toggle = api.campaign.toggleCloak.useMutation({ onError: () => setOn(cloak) });

  return (
    <button
      type="button"
      title={on ? "Cloaker ACTIVO — la landing redirige a ropa. Click para apagar." : "Cloaker apagado — la landing se muestra normal. Click para activar."}
      onClick={() => { const next = !on; setOn(next); toggle.mutate({ id, cloak: next }); }}
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:opacity-80"
      style={{ color: on ? "var(--color-warning)" : "var(--color-muted-foreground)" }}
    >
      {on ? <Shield className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
    </button>
  );
}
