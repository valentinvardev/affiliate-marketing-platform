"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/trpc/react";
import { Bot, X, Send, Loader2, Wrench, AlertTriangle } from "lucide-react";

type PendingAction = { type: "pause_vccs"; count: number } | null;
type Msg = { role: "user" | "assistant"; content: string; toolsUsed?: string[]; pendingAction?: PendingAction };

const TOOL_LABELS: Record<string, string> = {
  get_finances: "finanzas",
  get_period_stats: "métricas del período",
  list_campaigns: "campañas",
  get_vccs: "VCCs",
  search_knowledge: "base de conocimientos",
  pause_my_vccs: "pausar VCCs",
  generate_angles: "generar ángulos",
};

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = api.assistant.send.useMutation();
  const runAction = api.assistant.runAction.useMutation();

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, send.isPending]);

  async function onSend() {
    const text = input.trim();
    if (!text || send.isPending) return;
    setInput("");
    const history = msgs.slice(-12).map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, { role: "user", content: text }]);
    try {
      const res = await send.mutateAsync({ message: text, history });
      setMsgs((m) => [...m, { role: "assistant", content: res.reply, toolsUsed: res.toolsUsed, pendingAction: res.pendingAction }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: "Uy, algo falló: " + (e instanceof Error ? e.message : "error") }]);
    }
  }

  async function onConfirm(idx: number, action: NonNullable<PendingAction>) {
    try {
      const r = await runAction.mutateAsync({ type: action.type });
      setMsgs((m) => m.map((mm, i) => (i === idx ? { ...mm, pendingAction: null } : mm))
        .concat([{ role: "assistant", content: `Listo — pausé ${r.paused} de ${r.total} VCCs.` }]));
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: "No pude ejecutar la acción: " + (e instanceof Error ? e.message : "error") }]);
    }
  }

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button type="button" onClick={() => setOpen(true)} title="Asistente"
          className="fixed bottom-5 right-5 z-[70] flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
          <Bot className="h-5 w-5" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-[70] flex w-[calc(100vw-2.5rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl sm:w-[380px]"
          style={{ height: "min(600px, calc(100vh - 2.5rem))", background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
          {/* Header */}
          <div className="flex shrink-0 items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <Bot className="h-4 w-4" style={{ color: "var(--color-foreground)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Asistente</p>
            <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>tu segundo cerebro</span>
            <button type="button" onClick={() => setOpen(false)} className="ml-auto" style={{ color: "var(--color-subtle)" }}><X className="h-4 w-4" /></button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
            {msgs.length === 0 && (
              <div className="mt-6 px-2 text-center text-xs" style={{ color: "var(--color-subtle)" }}>
                Preguntame por tus números (gasto, profit, clicks), pedime que busque algo, o una acción como pausar tus VCCs.
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                  style={m.role === "user"
                    ? { background: "var(--color-foreground)", color: "var(--color-background)", whiteSpace: "pre-wrap" }
                    : { background: "var(--color-surface-overlay)", color: "var(--color-foreground)", border: "1px solid var(--color-border)", whiteSpace: "pre-wrap" }}>
                  {m.content}
                  {m.role === "assistant" && m.toolsUsed && m.toolsUsed.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.toolsUsed.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]" style={{ background: "var(--color-surface-raised)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>
                          <Wrench className="h-2.5 w-2.5" /> {TOOL_LABELS[t] ?? t}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.role === "assistant" && m.pendingAction && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg p-2" style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-border)" }}>
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-warning)" }} />
                      <span className="text-[11px]" style={{ color: "var(--color-foreground)" }}>Confirmá para pausar {m.pendingAction.count} VCC{m.pendingAction.count !== 1 ? "s" : ""}.</span>
                      <button type="button" disabled={runAction.isPending} onClick={() => onConfirm(i, m.pendingAction!)}
                        className="ml-auto shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50"
                        style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
                        {runAction.isPending ? "…" : "Confirmar"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {send.isPending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3 py-2" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--color-muted-foreground)" }} />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex shrink-0 items-end gap-2 p-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void onSend(); } }}
              placeholder="Escribí algo…"
              className="max-h-28 min-h-[40px] flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
            <button type="button" onClick={() => void onSend()} disabled={!input.trim() || send.isPending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg disabled:opacity-40"
              style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
