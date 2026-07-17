"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { api } from "@/trpc/react";
import { Bot, X, Send, Wrench, AlertTriangle, Sparkles, Loader2, SquarePen } from "lucide-react";

const AngleModal = dynamic(() => import("@/components/angles-manager").then((m) => m.AngleModal), { ssr: false });

type PendingAction = { type: "pause_vccs"; count: number } | null;
type Ref = { kind: "angle"; id: string; label: string };
type Msg = { id: string; role: "user" | "assistant"; content: string; toolsUsed?: string[]; pendingAction?: PendingAction; refs?: Ref[] };

const TOOL_LABELS: Record<string, string> = {
  get_finances: "finanzas",
  get_period_stats: "métricas del período",
  get_stats_by_campaign: "desglose por campaña",
  list_campaigns: "campañas",
  get_vccs: "VCCs",
  search_knowledge: "base de conocimientos",
  pause_my_vccs: "pausar VCCs",
  generate_angles: "generar ángulos",
};

let msgId = 0;
const nextId = () => `m${++msgId}`;

/* Inline: **negrita** + fade palabra por palabra (contador compartido para el stagger) */
function renderInline(text: string, ctr: { n: number }): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0; let key = 0; let m: RegExpExecArray | null;
  const pushWords = (str: string, bold: boolean) => {
    for (const p of str.split(/(\s+)/)) {
      if (p === "") continue;
      if (/^\s+$/.test(p)) { out.push(<span key={key++}>{p}</span>); continue; }
      const delay = Math.min(ctr.n++ * 20, 1400);
      const span = <span key={key++} style={{ display: "inline-block", opacity: 0, animation: "aiWord 0.26s ease forwards", animationDelay: `${delay}ms`, fontWeight: bold ? 700 : undefined }}>{p}</span>;
      out.push(span);
    }
  };
  while ((m = re.exec(text))) {
    if (m.index > last) pushWords(text.slice(last, m.index), false);
    pushWords(m[1] ?? "", true);
    last = m.index + m[0].length;
  }
  if (last < text.length) pushWords(text.slice(last), false);
  return out;
}

/* Markdown liviano: párrafos, viñetas y listas numeradas + negrita inline */
function Markdown({ text }: { text: string }) {
  const ctr = { n: 0 };
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0; let key = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (/^\s*[*\-•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[*\-•]\s+/.test(lines[i] ?? "")) { items.push((lines[i] ?? "").replace(/^\s*[*\-•]\s+/, "")); i++; }
      blocks.push(
        <ul key={key++} style={{ margin: "4px 0", padding: 0, listStyle: "none" }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ display: "flex", gap: 6, marginBottom: 2 }}>
              <span style={{ color: "var(--color-muted-foreground)" }}>•</span>
              <span>{renderInline(it, ctr)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) { items.push((lines[i] ?? "").replace(/^\s*\d+\.\s+/, "")); i++; }
      blocks.push(<ol key={key++} style={{ margin: "4px 0", paddingLeft: 18 }}>{items.map((it, idx) => <li key={idx} style={{ marginBottom: 2 }}>{renderInline(it, ctr)}</li>)}</ol>);
      continue;
    }
    if (line.trim() === "") { blocks.push(<div key={key++} style={{ height: 6 }} />); i++; continue; }
    blocks.push(<p key={key++} style={{ margin: 0 }}>{renderInline(line, ctr)}</p>);
    i++;
  }
  return <>{blocks}</>;
}

/* Indicador de "pensando" (shimmer + dots, cicla frases para esperas largas) */
function Thinking() {
  const phrases = ["Pensando", "Trabajando", "Procesando", "Casi listo"];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x < phrases.length - 1 ? x + 1 : x)), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
      <span className="ai-shimmer text-sm font-medium">{phrases[i]}…</span>
      <span className="flex items-end gap-0.5">
        {[0, 1, 2].map((d) => (
          <span key={d} style={{ width: 5, height: 5, borderRadius: 99, background: "var(--color-muted-foreground)", animation: `aiDot 1s ease-in-out ${d * 0.15}s infinite` }} />
        ))}
      </span>
    </div>
  );
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // sigue montado durante la animación de cierre
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [openAngleId, setOpenAngleId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches);
  const [vv, setVv] = useState<{ height: number; offsetTop: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();
  const send = api.assistant.send.useMutation();
  const runAction = api.assistant.runAction.useMutation();
  const angleQ = api.angles.get.useQuery({ id: openAngleId ?? "" }, { enabled: !!openAngleId });
  const historyQ = api.assistant.history.useQuery(undefined, { enabled: open, refetchOnWindowFocus: false });
  const clear = api.assistant.clear.useMutation({ onSuccess: () => { setMsgs([]); void utils.assistant.history.invalidate(); } });
  const inited = useRef(false);

  // Cargar el historial (últimas 24 h) una sola vez.
  useEffect(() => {
    if (inited.current || !historyQ.data) return;
    inited.current = true;
    if (historyQ.data.length) {
      setMsgs(historyQ.data.map((r) => ({ id: r.id, role: r.role, content: r.content, toolsUsed: r.meta?.toolsUsed, refs: r.meta?.refs, pendingAction: null })));
    }
  }, [historyQ.data]);

  // Mobile vs desktop
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onMq = () => setIsMobile(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  // Seguir el viewport visible: al abrir/cerrar el teclado el panel se ajusta al área visible.
  useEffect(() => {
    const vvp = window.visualViewport;
    if (!vvp) return;
    const update = () => setVv({ height: vvp.height, offsetTop: vvp.offsetTop });
    update();
    vvp.addEventListener("resize", update);
    vvp.addEventListener("scroll", update);
    return () => { vvp.removeEventListener("resize", update); vvp.removeEventListener("scroll", update); };
  }, [open]);

  // En mobile bloqueamos el scroll de la página de atrás mientras el chat está abierto.
  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, isMobile]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, send.isPending, vv]);

  async function onSend() {
    const text = input.trim();
    if (!text || send.isPending) return;
    setInput("");
    setMsgs((m) => [...m, { id: nextId(), role: "user", content: text }]);
    try {
      const res = await send.mutateAsync({ message: text });
      setMsgs((m) => [...m, { id: nextId(), role: "assistant", content: res.reply, toolsUsed: res.toolsUsed, pendingAction: res.pendingAction, refs: res.refs }]);
    } catch (e) {
      setMsgs((m) => [...m, { id: nextId(), role: "assistant", content: "Uy, algo falló: " + (e instanceof Error ? e.message : "error") }]);
    }
  }

  async function onConfirm(id: string, action: NonNullable<PendingAction>) {
    try {
      const r = await runAction.mutateAsync({ type: action.type });
      setMsgs((m) => m.map((mm) => (mm.id === id ? { ...mm, pendingAction: null } : mm))
        .concat([{ id: nextId(), role: "assistant", content: `Listo — pausé ${r.paused} de ${r.total} VCCs.` }]));
    } catch (e) {
      setMsgs((m) => [...m, { id: nextId(), role: "assistant", content: "No pude ejecutar la acción: " + (e instanceof Error ? e.message : "error") }]);
    }
  }

  return (
    <>
      {!open && (
        <button type="button" onClick={() => { setMounted(true); setOpen(true); }} title="Asistente"
          className="fixed bottom-5 right-5 z-[70] flex h-12 w-12 items-center justify-center rounded-full transition-transform hover:scale-105"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)", boxShadow: "0 8px 30px rgba(0,0,0,0.5)", animation: "aiPop 0.2s ease" }}>
          <Bot className="h-5 w-5" />
        </button>
      )}

      {/* Capa opaca entre el chat y la página (mobile): tapa el hueco input↔teclado y evita ver la interfaz de atrás */}
      {mounted && isMobile && (
        <div className="fixed inset-0 z-[69]" onClick={() => setOpen(false)}
          style={{ background: "var(--color-surface-raised)", touchAction: "none", animation: open ? "aiFade 0.2s ease" : undefined }} />
      )}

      {mounted && (
        <div className="fixed z-[70] flex flex-col overflow-hidden"
          onAnimationEnd={() => { if (!open) setMounted(false); }}
          style={{
            ...(isMobile
              ? { left: 0, top: vv?.offsetTop ?? 0, width: "100vw", height: vv ? `${vv.height}px` : "100dvh", borderRadius: 0, border: "none" }
              : { right: 20, bottom: 20, width: "min(380px, calc(100vw - 2.5rem))", height: "min(600px, calc(100vh - 2.5rem))", borderRadius: 16, border: "1px solid var(--color-border)" }),
            background: "var(--color-surface-raised)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
            transformOrigin: isMobile ? "center bottom" : "bottom right",
            animation: open ? "aiPanelIn 0.2s ease forwards" : "aiPanelOut 0.16s ease forwards",
          }}>
          <div className="flex shrink-0 items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <Bot className="h-4 w-4" style={{ color: "var(--color-foreground)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Asistente</p>
            <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>tu segundo cerebro</span>
            <div className="ml-auto flex items-center gap-1">
              {msgs.length > 0 && (
                <button type="button" onClick={() => clear.mutate()} disabled={clear.isPending} title="Nueva conversación"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md" style={{ color: "var(--color-subtle)" }}>
                  {clear.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SquarePen className="h-4 w-4" />}
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} title="Cerrar" className="inline-flex h-7 w-7 items-center justify-center rounded-md" style={{ color: "var(--color-subtle)" }}><X className="h-4 w-4" /></button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3" style={{ overscrollBehavior: "contain", touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
            {msgs.length === 0 && (
              <div className="mt-6 px-2 text-center text-xs" style={{ color: "var(--color-subtle)" }}>
                Preguntame por tus números (gasto, profit, clicks), pedime que busque algo, o una acción como pausar tus VCCs.
              </div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                  style={m.role === "user"
                    ? { background: "var(--color-foreground)", color: "var(--color-background)", whiteSpace: "pre-wrap" }
                    : { background: "var(--color-surface-overlay)", color: "var(--color-foreground)", border: "1px solid var(--color-border)" }}>
                  {m.role === "assistant" ? <Markdown text={m.content} /> : m.content}

                  {m.role === "assistant" && m.toolsUsed && m.toolsUsed.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.toolsUsed.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]" style={{ background: "var(--color-surface-raised)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}>
                          <Wrench className="h-2.5 w-2.5" /> {TOOL_LABELS[t] ?? t}
                        </span>
                      ))}
                    </div>
                  )}

                  {m.role === "assistant" && m.refs && m.refs.map((r) => {
                    const opening = openAngleId === r.id && angleQ.isLoading;
                    return (
                      <button key={r.id} type="button" disabled={opening} onClick={() => setOpenAngleId(r.id)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-opacity hover:opacity-90 disabled:opacity-80"
                        style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
                        {opening ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} {opening ? "Abriendo…" : `Ver ${r.label}`}
                      </button>
                    );
                  })}

                  {m.role === "assistant" && m.pendingAction && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg p-2" style={{ background: "var(--color-warning-bg)", border: "1px solid var(--color-border)" }}>
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-warning)" }} />
                      <span className="text-[11px]" style={{ color: "var(--color-foreground)" }}>Confirmá para pausar {m.pendingAction.count} VCC{m.pendingAction.count !== 1 ? "s" : ""}.</span>
                      <button type="button" disabled={runAction.isPending} onClick={() => onConfirm(m.id, m.pendingAction!)}
                        className="ml-auto shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50"
                        style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
                        {runAction.isPending ? "…" : "Confirmar"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {send.isPending && <div className="flex justify-start"><Thinking /></div>}
          </div>

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

      {/* Modal del ángulo (lazy) abierto desde el chat */}
      {openAngleId && angleQ.data && (
        <AngleModal
          data={{ id: angleQ.data.id, country: angleQ.data.country, market: angleQ.data.market as never, angles: angleQ.data.angles as never }}
          onClose={() => setOpenAngleId(null)}
        />
      )}
    </>
  );
}
