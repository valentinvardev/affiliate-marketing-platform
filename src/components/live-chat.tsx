"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { X, Send, MessageCircle } from "lucide-react";
import { api } from "@/trpc/react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Msg = {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
};

function toMsg(row: {
  id: string; userId: string; username: string; text: string; createdAt: string | Date;
}): Msg {
  return {
    id:        row.id,
    userId:    row.userId,
    username:  row.username,
    text:      row.text,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : row.createdAt.toISOString(),
  };
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

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

  /* Scroll to bottom */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  function send() {
    const text = input.trim();
    if (!text || !me) return;
    setInput("");
    sendMut.mutate(
      { userId: me, username: myName, text },
      { onSuccess: (row) => merge([toMsg(row)]) },
    );
  }

  // Sin sesión (ej. landing pública) no renderiza el chat.
  if (!me) return null;

  return (
    <>
      {/* Sidebar */}
      <div
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
            gap:        12,
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

          {msgs.map((m) => {
            const mine = m.userId === me;
            return (
              <div
                key={m.id}
                style={{
                  display:       "flex",
                  flexDirection: "column",
                  alignItems:    mine ? "flex-end" : "flex-start",
                }}
              >
                {!mine && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-muted-foreground)", marginBottom: 3, paddingLeft: 4 }}>
                    {m.username}
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
                  }}
                >
                  {m.text}
                </div>
                <span style={{ marginTop: 3, fontSize: 10, color: "var(--color-subtle)" }}>
                  {fmtTime(m.createdAt)}
                </span>
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
