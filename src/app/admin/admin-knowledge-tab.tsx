"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Loader2, Trash2, RefreshCw, ChevronDown, ChevronRight, Check, Sparkles, PencilLine } from "lucide-react";

const SOURCE_PRESETS = ["estrategia", "faq", "docs", "notas"];

function Card({ title, desc, count, children }: { title: string; desc?: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{title}</h2>
        {count !== undefined && (
          <span className="rounded-full px-2 py-0.5 text-[11px]" style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>{count}</span>
        )}
      </div>
      {desc && <p className="mb-4 text-xs" style={{ color: "var(--color-muted-foreground)" }}>{desc}</p>}
      {children}
    </div>
  );
}

function SourceRow({ source, kind, count, onRemove, removing }: { source: string; kind: string; count: number; onRemove: () => void; removing: boolean }) {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();
  const chunksQ = api.knowledge.chunks.useQuery({ source }, { enabled: open });
  const removeChunk = api.knowledge.removeChunk.useMutation({
    onSuccess: () => { void chunksQ.refetch(); void utils.knowledge.sources.invalidate(); },
  });
  return (
    <div className="rounded-lg" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-overlay)" }}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />}
          <span className="truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{source}</span>
          <span className="rounded px-1.5 py-0.5 text-[10px]" style={{ background: kind === "auto" ? "var(--color-success-bg)" : "var(--color-surface-raised)", color: kind === "auto" ? "var(--color-success)" : "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>{kind}</span>
        </button>
        <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>{count} frag.</span>
        <button type="button" onClick={onRemove} disabled={removing} title="Borrar fuente" className="inline-flex h-7 w-7 items-center justify-center rounded-md disabled:opacity-40" style={{ color: "var(--color-error)" }}>
          {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>
      {open && (
        <div className="space-y-1.5 border-t px-3 py-2" style={{ borderColor: "var(--color-border)" }}>
          {chunksQ.isLoading ? (
            <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
          ) : (chunksQ.data ?? []).length === 0 ? (
            <p className="py-2 text-center text-xs" style={{ color: "var(--color-subtle)" }}>Sin fragmentos.</p>
          ) : (
            (chunksQ.data ?? []).map((c) => (
              <div key={c.id} className="flex items-start gap-2 rounded-md px-2.5 py-1.5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                <span className="min-w-0 flex-1 text-[11px] leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>{c.content.slice(0, 240)}{c.content.length > 240 ? "…" : ""}</span>
                <button type="button" onClick={() => removeChunk.mutate({ id: c.id })} className="shrink-0" style={{ color: "var(--color-subtle)" }}><Trash2 className="h-3 w-3" /></button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function AdminKnowledgeTab() {
  const utils = api.useUtils();
  const sourcesQ = api.knowledge.sources.useQuery();
  const add = api.knowledge.addText.useMutation({ onSuccess: () => { setText(""); void utils.knowledge.sources.invalidate(); } });
  const reindex = api.knowledge.reindex.useMutation({ onSuccess: () => void utils.knowledge.sources.invalidate() });
  const removeSource = api.knowledge.removeSource.useMutation({ onSuccess: () => void utils.knowledge.sources.invalidate() });

  const [source, setSource] = useState("estrategia");
  const [text, setText] = useState("");

  const sources = sourcesQ.data ?? [];
  const total = sources.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-6">
      {/* Cargar conocimiento manual */}
      <Card title="Cargar conocimiento" desc="Pegá tu estrategia, FAQ o docs. Se parte en fragmentos, se embebe y el asistente lo usa para responder con tu criterio.">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <PencilLine className="h-3.5 w-3.5" style={{ color: "var(--color-subtle)" }} />
          <span className="mr-1 text-[11px]" style={{ color: "var(--color-subtle)" }}>Fuente:</span>
          {SOURCE_PRESETS.map((s) => (
            <button key={s} type="button" onClick={() => setSource(s)} className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{ background: source === s ? "var(--color-foreground)" : "transparent", color: source === s ? "var(--color-background)" : "var(--color-muted-foreground)", border: `1px solid ${source === s ? "var(--color-foreground)" : "var(--color-border)"}` }}>{s}</button>
          ))}
          <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="o escribí una…" className="w-32 rounded-md px-2.5 py-1 text-[11px] outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Pegá acá tu conocimiento…"
          className="w-full resize-y rounded-md px-3 py-2 text-sm outline-none" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
        <div className="mt-2 flex items-center gap-3">
          <button type="button" disabled={!text.trim() || !source.trim() || add.isPending} onClick={() => add.mutate({ source, text })}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-50" style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
            {add.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Cargar
          </button>
          {add.isSuccess && add.data && <span className="text-xs" style={{ color: "var(--color-success)" }}>Agregados {add.data.added} fragmentos.</span>}
          {add.isError && <span className="text-xs" style={{ color: "var(--color-error)" }}>{add.error.message}</span>}
        </div>
      </Card>

      {/* Reindexar desde la DB */}
      <Card title="Reindexar desde la plataforma" desc="Trae al asistente lo que ya vive en tu DB: la KB de ángulos y el catálogo de apps.">
        <div className="flex items-center gap-3">
          <button type="button" disabled={reindex.isPending} onClick={() => reindex.mutate()}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
            {reindex.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Reindexar
          </button>
          {reindex.isSuccess && reindex.data && <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--color-success)" }}><Sparkles className="h-3 w-3" /> KB ángulos: {reindex.data.angleKb} · Apps: {reindex.data.apps}</span>}
          {reindex.isError && <span className="text-xs" style={{ color: "var(--color-error)" }}>{reindex.error.message}</span>}
        </div>
      </Card>

      {/* Contenido cargado */}
      <Card title="Contenido cargado" count={total}>
        {sourcesQ.isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
        ) : sources.length === 0 ? (
          <p className="py-4 text-center text-sm" style={{ color: "var(--color-muted-foreground)" }}>Base vacía. Cargá conocimiento o reindexá desde la plataforma.</p>
        ) : (
          <div className="space-y-2">
            {sources.map((s) => (
              <SourceRow key={`${s.source}-${s.kind}`} source={s.source} kind={s.kind} count={s.count}
                removing={removeSource.isPending && removeSource.variables?.source === s.source}
                onRemove={() => { if (confirm(`¿Borrar toda la fuente "${s.source}"?`)) removeSource.mutate({ source: s.source }); }} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
