"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, Globe, Trash2, Plus, ExternalLink, AlertCircle } from "lucide-react";

export function AdminDomainsTab() {
  const utils = api.useUtils();
  const domainsQ = api.domains.list.useQuery();
  const [domain, setDomain] = useState("");

  const add = api.domains.add.useMutation({
    onSuccess: () => { setDomain(""); void utils.domains.list.invalidate(); },
  });
  const remove = api.domains.remove.useMutation({
    onSuccess: () => void utils.domains.list.invalidate(),
  });

  const domains = domainsQ.data ?? [];

  return (
    <div className="space-y-6">
      {/* ── Registrar dominio ── */}
      <Section title="Registrar un dominio raíz" icon={Plus}>
        <form
          onSubmit={(e) => { e.preventDefault(); if (domain) add.mutate({ domain }); }}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Dominio</label>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="empfohlen.lat"
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              />
            </div>
            <button
              type="submit"
              disabled={add.isPending || !domain}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
            >
              {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Registrar
            </button>
            {add.error && (
              <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--color-error)" }}>
                <AlertCircle className="h-3.5 w-3.5" /> {add.error.message}
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-subtle)" }}>
            Se guarda el apex en minúsculas (sin <code>www</code>). El dominio queda disponible para asignarlo a las{" "}
            <strong>ofertas</strong> (en Offers); las campañas creadas desde esas ofertas salen en
            <code> dominio/&lt;slug&gt;</code>. Acordate de apuntar el DNS al VPS + nginx/Cloudflare.
          </p>
        </form>
      </Section>

      {/* ── Lista ── */}
      <Section title="Dominios registrados" icon={Globe} count={domains.length}>
        {domainsQ.isLoading ? (
          <Spinner />
        ) : domains.length === 0 ? (
          <Empty>Todavía no registraste ningún dominio.</Empty>
        ) : (
          <div className="space-y-2">
            {domains.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}
              >
                <Globe className="h-4 w-4 shrink-0" style={{ color: "var(--color-subtle)" }} />
                <a
                  href={`https://${d.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-w-0 flex-1 items-center gap-1.5 text-sm font-medium hover:underline"
                  style={{ color: "var(--color-foreground)" }}
                >
                  <span className="truncate">{d.domain}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" style={{ color: "var(--color-subtle)" }} />
                </a>
                <button
                  type="button"
                  title="Quitar dominio"
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
