"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, Globe, Trash2, Plus, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

export function AdminDomainsTab() {
  const utils = api.useUtils();
  const domainsQ = api.domains.list.useQuery();
  const campsQ = api.campaign.list.useQuery();

  const [domain, setDomain] = useState("");
  const [campaignId, setCampaignId] = useState("");

  const add = api.domains.add.useMutation({
    onSuccess: () => {
      setDomain("");
      void utils.domains.list.invalidate();
    },
  });
  const remove = api.domains.remove.useMutation({
    onSuccess: () => void utils.domains.list.invalidate(),
  });

  const camps = campsQ.data ?? [];
  const domains = domainsQ.data ?? [];

  return (
    <div className="space-y-6">
      {/* ── Agregar dominio ── */}
      <Section title="Conectar un dominio a una campaña" icon={Plus}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!domain || !campaignId) return;
            add.mutate({ domain, campaignId });
          }}
          className="space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Dominio</label>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="empfohlen.lat"
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Campaña home (opcional)</label>
              <select
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none sm:w-56"
                style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: campaignId ? "var(--color-foreground)" : "var(--color-subtle)" }}
              >
                <option value="">Sin home (path-based)</option>
                {camps.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} (s1={c.slug})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={add.isPending || !domain}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
            >
              {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Registrar dominio
            </button>
            {add.error && (
              <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-error)" }}>
                <AlertCircle className="h-3.5 w-3.5" /> {add.error.message}
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-subtle)" }}>
            Path-based: una vez registrado, el dominio sirve <code>dominio/&lt;slug&gt;</code> para cualquier campaña.
            Asignás el dominio a las <strong>ofertas</strong> (en Offers) y las campañas creadas desde ellas salen ahí.
            La campaña "home" (opcional) es lo que muestra el root <code>dominio/</code>.
          </p>
        </form>
      </Section>

      {/* ── Lista ── */}
      <Section title="Dominios conectados" icon={Globe} count={domains.length}>
        {domainsQ.isLoading ? (
          <Spinner />
        ) : domains.length === 0 ? (
          <Empty>Todavía no conectaste ningún dominio.</Empty>
        ) : (
          <div className="space-y-2">
            {domains.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.campaign?.colorPrimary ?? "var(--color-subtle)" }} />
                <div className="min-w-0 flex-1">
                  <a
                    href={`https://${d.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                    style={{ color: "var(--color-foreground)" }}
                  >
                    {d.domain}
                    <ExternalLink className="h-3 w-3" style={{ color: "var(--color-subtle)" }} />
                  </a>
                  <p className="truncate text-[11px]" style={{ color: "var(--color-subtle)" }}>
                    {d.campaign ? (
                      <>home: {d.campaign.name} <span className="font-mono">(s1={d.campaign.slug})</span>
                        {!d.campaign.isActive && <span style={{ color: "var(--color-warning)" }}> · inactiva</span>}</>
                    ) : (
                      <>path-based · sin home</>
                    )}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "var(--color-success)" }} />
                <button
                  type="button"
                  title="Desconectar dominio"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate({ id: d.id })}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-50"
                  style={{ color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ── Sub-componentes ── */
function Section({ title, icon: Icon, count, children }: { title: string; icon: React.ElementType; count?: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{title}</h2>
        {count !== undefined && (
          <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>{children}</p>;
}
