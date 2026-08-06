"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { X, Send, MessageCircle, Bot } from "lucide-react";
import { api } from "@/trpc/react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Avatar } from "@/components/ui/avatar";

type Msg = {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
  avatarUrl?: string | null;
};

function toMsg(row: {
  id: string; userId: string; username: string; text: string; createdAt: string | Date;
  // Opcional: los mensajes que llegan por realtime vienen de la tabla cruda,
  // sin el avatar que agrega el router al listar.
  avatarUrl?: string | null;
}): Msg {
  return {
    id:        row.id,
    userId:    row.userId,
    username:  row.username,
    text:      row.text,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : row.createdAt.toISOString(),
    avatarUrl: row.avatarUrl ?? null,
  };
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

const IA_BOT_ID = "ia-bot";

// Blip corto al enviar (Web Audio, sin assets).
let ac: AudioContext | null = null;
function playSendBlip() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ac ??= new AC();
    if (ac.state === "suspended") void ac.resume();
    const o = ac.createOscillator(); const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = "sine";
    o.frequency.setValueAtTime(680, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(920, ac.currentTime + 0.07);
    g.gain.setValueAtTime(0.05, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.16);
    o.start(); o.stop(ac.currentTime + 0.18);
  } catch { /* silencio si no hay audio */ }
}

/** Etiqueta del separador de día: Hoy / Ayer / fecha. */
function dayLabel(d: Date): string {
  const day = new Date(d); day.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7) return day.toLocaleDateString(undefined, { weekday: "long" });
  return day.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
/** Ventana para considerar mensajes "seguidos" del mismo autor. */
const GROUP_MS = 5 * 60 * 1000;


export function LiveChatProvider() {
  const { data: session } = useSession();
  const me       = session?.user?.id ?? "";
  const myName   = session?.user?.name ?? "Yo";

  const [open, setOpen]   = useState(false);
  const [msgs, setMsgs]   = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const bottomRef         = useRef<HTMLDivElement>(null);

  const utils = api.useUtils();
  // Sólo el panel (con sesión) usa el chat. En landings públicas no hay sesión →
  // no dispara chat.list ni la suscripción realtime.
  const listQuery = api.chat.list.useQuery(undefined, { refetchInterval: 6000, enabled: !!me });
  const sendMut   = api.chat.send.useMutation();

  /* Merge incoming rows, dedupe by id, sort by time */
  const merge = useCallback((incoming: Msg[]) => {
    setMsgs((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, m);
      return [...map.values()].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
  }, []);

  /* Seed + poll merge */
  useEffect(() => {
    if (listQuery.data) merge(listQuery.data.map(toMsg));
  }, [listQuery.data, merge]);

  /* Realtime subscription (solo con sesión) */
  useEffect(() => {
    if (!me) return;
    const channel = supabaseBrowser
      .channel("chat-room")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ChatMessage" },
        (payload) => {
          merge([toMsg(payload.new as Msg)]);
          void utils.chat.list.invalidate();
        },
      )
      .subscribe();
    return () => { void supabaseBrowser.removeChannel(channel); };
  }, [me, merge, utils]);

  /* Open via header button */
  const openChat = useCallback(() => setOpen(true), []);
  useEffect(() => {
    window.addEventListener("chat:open", openChat);
    return () => window.removeEventListener("chat:open", openChat);
  }, [openChat]);

  /* Avisa a los demas overlays (el FAB del asistente) que el chat esta abierto,
     asi no quedan uno encima del otro. */
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("chat:state", { detail: { open } }));
  }, [open]);

  /* Escape cierra el panel */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* Scroll to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  function send() {
    const text = input.trim();
    if (!text || !me) return;
    setInput("");
    playSendBlip();
    sendMut.mutate(
      { userId: me, username: myName, text },
      { onSuccess: (row) => merge([toMsg(row)]) },
    );
  }

  // Sin sesión (ej. landing pública) no renderiza el chat.
  if (!me) return null;

  return (
    <>
      {/* Fondo: difumina el panel y cierra al tocar afuera. Se mantiene montado
          para poder animar la opacidad al abrir y cerrar. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden={!open}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 54,
          background: "rgba(4,6,12,0.45)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.24s ease",
        }}
      />

      {/* Sidebar */}
      {/* safe-top/bottom: el panel va de borde a borde vertical, así que sin
          esto el header queda bajo el reloj y el input bajo la barra de gestos.
          El padding lo absorbe el propio panel, que ya tiene su fondo, así que
          las franjas se ven continuas con él. */}
      <div
        className="safe-top safe-bottom"
        style={{
          position:   "fixed",
          top:        0,
          right:      0,
          bottom:     0,
          zIndex:     55,
          width:      340,
          display:    "flex",
          flexDirection: "column",
          transform:  open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          background: "var(--color-surface-raised)",
          borderLeft: "1px solid var(--color-border)",
          boxShadow:  "-8px 0 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display:       "flex",
            alignItems:    "center",
            gap:           10,
            padding:       "14px 16px",
            borderBottom:  "1px solid var(--color-border)",
            flexShrink:    0,
          }}
        >
          <div
            style={{
              width:          36,
              height:         36,
              borderRadius:   "50%",
              background:     "var(--color-surface-overlay)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
            }}
          >
            <MessageCircle style={{ width: 16, height: 16, color: "var(--color-muted-foreground)" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
              TapSur
            </p>
            <p style={{ fontSize: 11, color: "var(--color-subtle)" }}>
              Canal general
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              background: "none",
              border:     "none",
              cursor:     "pointer",
              padding:    4,
              color:      "var(--color-subtle)",
            }}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* Messages */}
        <div
          style={{
            flex:       1,
            overflowY:  "auto",
            padding:    "16px 14px",
            display:    "flex",
            flexDirection: "column",
            gap:        6,
          }}
        >
          {msgs.length === 0 && (
            <div style={{ margin: "auto", textAlign: "center", padding: "0 20px" }}>
              <MessageCircle style={{ width: 22, height: 22, color: "var(--color-subtle)", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 12, color: "var(--color-subtle)" }}>
                Todavía no hay mensajes. ¡Escribí el primero!
              </p>
            </div>
          )}

          {msgs.map((m, i) => {
            const mine = m.userId === me;
            const isIa = m.userId === IA_BOT_ID;
            const at = new Date(m.createdAt);
            const prev = i > 0 ? msgs[i - 1] : undefined;
            const next = i < msgs.length - 1 ? msgs[i + 1] : undefined;
            const prevAt = prev ? new Date(prev.createdAt) : null;
            const nextAt = next ? new Date(next.createdAt) : null;

            // Separador cuando cambia el día respecto del mensaje anterior.
            const newDay = !prevAt || !sameDay(prevAt, at);
            // Encabezado (avatar + nombre) solo al arrancar una tanda: cambia
            // de autor, cambia el día, o pasaron más de 5 minutos.
            const startsRun =
              newDay || !prev || prev.userId !== m.userId || at.getTime() - prevAt!.getTime() > GROUP_MS;
            // La hora se muestra una sola vez, al cerrar la tanda, para no
            // repetir el mismo minuto debajo de cada burbuja.
            const endsRun =
              !next || next.userId !== m.userId ||
              !sameDay(at, nextAt!) || nextAt!.getTime() - at.getTime() > GROUP_MS;

            return (
              <div key={m.id + "-w"} style={{ display: "contents" }}>
              {newDay && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0 2px" }}>
                  <span style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: "capitalize", color: "var(--color-subtle)" }}>
                    {dayLabel(at)}
                  </span>
                  <span style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
                </div>
              )}
              <div
                key={m.id}
                style={{
                  display:       "flex",
                  flexDirection: "column",
                  alignItems:    mine ? "flex-end" : "flex-start",
                  animation:     "chatMsgIn 0.28s ease both",
                }}
              >
                {!mine && startsRun && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 4, paddingLeft: 2 }}>
                    <Avatar name={m.username} url={m.avatarUrl} size={20} />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 600, color: isIa ? "var(--color-accent)" : "var(--color-muted-foreground)" }}>
                      {isIa && !m.avatarUrl && <Bot style={{ width: 12, height: 12 }} />}
                      {m.username}
                    </span>
                  </span>
                )}
                <div
                  style={{
                    maxWidth:     "80%",
                    borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    padding:      "9px 13px",
                    fontSize:     13,
                    lineHeight:   1.5,
                    whiteSpace:   "pre-wrap",
                    wordBreak:    "break-word",
                    background:   mine ? "var(--color-foreground)" : "var(--color-surface-overlay)",
                    color:        mine ? "var(--color-background)" : "var(--color-foreground)",
                    border:       isIa ? "1px solid var(--color-accent)" : undefined,
                  }}
                >
                  {m.text}
                </div>
                {endsRun && (
                  <span style={{ marginTop: 3, fontSize: 10, color: "var(--color-subtle)" }}>
                    {fmtTime(m.createdAt)}
                  </span>
                )}
              </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          style={{
            padding:      "12px 14px",
            borderTop:    "1px solid var(--color-border)",
            flexShrink:   0,
            display:      "flex",
            gap:          8,
            alignItems:   "flex-end",
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={me ? "Escribí tu mensaje…" : "Iniciá sesión para chatear"}
            disabled={!me}
            rows={1}
            style={{
              flex:        1,
              resize:      "none",
              borderRadius: 10,
              padding:     "8px 12px",
              fontSize:    13,
              lineHeight:  1.5,
              outline:     "none",
              background:  "var(--color-surface-overlay)",
              border:      "1px solid var(--color-border)",
              color:       "var(--color-foreground)",
              fontFamily:  "inherit",
            }}
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || !me}
            style={{
              width:          34,
              height:         34,
              borderRadius:   10,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
              border:         "none",
              cursor:         input.trim() && me ? "pointer" : "not-allowed",
              background:     input.trim() && me ? "var(--color-foreground)" : "var(--color-surface-overlay)",
              color:          input.trim() && me ? "var(--color-background)" : "var(--color-subtle)",
              transition:     "background 0.15s ease",
            }}
          >
            <Send style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    </>
  );
}
