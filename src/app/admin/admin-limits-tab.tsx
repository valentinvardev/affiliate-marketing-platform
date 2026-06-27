"use client";

import { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Loader2, CreditCard, Check, AlertCircle } from "lucide-react";

export function AdminLimitsTab() {
  const utils = api.useUtils();
  const configQ = api.limits.config.useQuery();
  const save = api.limits.setConfig.useMutation({
    onSuccess: () => { void utils.limits.config.invalidate(); void utils.limits.status.invalidate(); setSaved(true); setTimeout(() => setSaved(false), 1800); },
  });

  const [maxCards, setMaxCards] = useState("");
  const [dailyCap, setDailyCap] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (configQ.data) {
      setMaxCards(String(configQ.data.maxCards));
      setDailyCap(String(configQ.data.dailyCap));
    }
  }, [configQ.data]);

  const maxN = parseInt(maxCards, 10);
  const capN = parseFloat(dailyCap);
  const valid = maxN >= 1 && maxN <= 50 && capN >= 1 && capN <= 100000;
  const dirty = !!configQ.data && (maxN !== configQ.data.maxCards || capN !== configQ.data.dailyCap);

  return (
    <div className="rounded-xl p-6" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="mb-1 flex items-center gap-2">
        <CreditCard className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Límites de tarjetas virtuales</h2>
      </div>
      <p className="mb-5 text-[11px] leading-relaxed" style={{ color: "var(--color-subtle)" }}>
        Tope de <strong>tarjetas activas simultáneas por usuario</strong> y de <strong>gasto diario</strong>. Al superar
        el gasto, las VCC del usuario se pausan y aparece el aviso en el topbar. Aplican a todos los usuarios.
      </p>

      {configQ.isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tarjetas simultáneas por usuario" hint="Entre 1 y 50.">
              <input
                type="number" min={1} max={50} value={maxCards}
                onChange={(e) => setMaxCards(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm tabular-nums outline-none"
                style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              />
            </Field>
            <Field label="Gasto diario máximo (USD)" hint="Se resetea cada día (UTC).">
              <div className="flex items-center rounded-md" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
                <span className="pl-3 text-sm" style={{ color: "var(--color-subtle)" }}>$</span>
                <input
                  type="number" min={1} step={10} value={dailyCap}
                  onChange={(e) => setDailyCap(e.target.value)}
                  className="w-full bg-transparent px-2 py-2 text-sm tabular-nums outline-none"
                  style={{ color: "var(--color-foreground)" }}
                />
              </div>
            </Field>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!valid || !dirty || save.isPending}
              onClick={() => save.mutate({ maxCards: maxN, dailyCap: capN })}
              className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
            >
              {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Guardar límites
            </button>
            {saved && <span className="text-xs" style={{ color: "var(--color-success)" }}>Guardado ✓</span>}
            {save.error && (
              <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-error)" }}>
                <AlertCircle className="h-3.5 w-3.5" /> {save.error.message}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>{label}</label>
      {children}
      {hint && <p className="text-[11px]" style={{ color: "var(--color-subtle)" }}>{hint}</p>}
    </div>
  );
}
