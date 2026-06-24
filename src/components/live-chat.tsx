"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, MessageCircle } from "lucide-react";

type Msg = { from: "team" | "user"; text: string; ts: string };

const INITIAL: Msg[] = [
  {
    from: "team",
    text: "¡Bienvenido al canal de TapSur! Escribinos cualquier cosa.",
    ts: now(),
  },
];

function now() {
  return new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

export function LiveChatProvider() {
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState<Msg[]>(INITIAL);
  const [input, setInput]     = useState("");
  const bottomRef             = useRef<HTMLDivElement>(null);

  const openChat = useCallback(() => setOpen(true), []);

  useEffect(() => {
    window.addEventListener("chat:open", openChat);
    return () => window.removeEventListener("chat:open", openChat);
  }, [openChat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { from: "user", text, ts: now() }]);
  }

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
              position:       "relative",
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
          {msgs.map((m, i) => (
            <div
              key={i}
              style={{
                display:       "flex",
                flexDirection: "column",
                alignItems:    m.from === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth:     "80%",
                  borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding:      "9px 13px",
                  fontSize:     13,
                  lineHeight:   1.5,
                  background:   m.from === "user"
                    ? "var(--color-foreground)"
                    : "var(--color-surface-overlay)",
                  color:        m.from === "user"
                    ? "var(--color-background)"
                    : "var(--color-foreground)",
                }}
              >
                {m.text}
              </div>
              <span
                style={{
                  marginTop: 3,
                  fontSize:  10,
                  color:     "var(--color-subtle)",
                }}
              >
                {m.ts}
              </span>
            </div>
          ))}
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
            placeholder="Escribí tu mensaje…"
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
            disabled={!input.trim()}
            style={{
              width:          34,
              height:         34,
              borderRadius:   10,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
              border:         "none",
              cursor:         input.trim() ? "pointer" : "not-allowed",
              background:     input.trim() ? "var(--color-foreground)" : "var(--color-surface-overlay)",
              color:          input.trim() ? "var(--color-background)" : "var(--color-subtle)",
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
