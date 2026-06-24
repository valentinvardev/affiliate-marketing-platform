"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Headphones } from "lucide-react";

type Msg = { from: "support" | "user"; text: string; ts: string };

const INITIAL: Msg[] = [
  {
    from: "support",
    text: "¡Hola! 👋 Soy del equipo de TapSur. ¿En qué te puedo ayudar hoy?",
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
  const [typing, setTyping]   = useState(false);
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMsgs((m) => [...m, { from: "user", text, ts: now() }]);
    setTyping(true);

    // Auto-reply after delay
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [
        ...m,
        {
          from: "support",
          text: "Gracias por tu mensaje. Un agente de soporte lo revisará pronto. Mientras tanto, podés revisar la documentación en el panel.",
          ts: now(),
        },
      ]);
    }, 1800);
  }

  return (
    <>
      {/* Toggle button — fixed top-right */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Chat en vivo"
        style={{
          position:   "fixed",
          top:        12,
          right:      20,
          zIndex:     60,
          display:    "flex",
          alignItems: "center",
          gap:        6,
          borderRadius: 9999,
          padding:    "6px 12px 6px 10px",
          fontSize:   12,
          fontWeight: 600,
          cursor:     "pointer",
          background: open ? "var(--color-surface-overlay)" : "var(--color-foreground)",
          color:      open ? "var(--color-muted-foreground)" : "var(--color-background)",
          border:     "1px solid var(--color-border)",
          transition: "background 0.15s ease, color 0.15s ease",
        }}
      >
        {open
          ? <X style={{ width: 14, height: 14 }} />
          : <MessageCircle style={{ width: 14, height: 14 }} />
        }
        {!open && "Chat"}
      </button>

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
            <Headphones style={{ width: 16, height: 16, color: "var(--color-muted-foreground)" }} />
            {/* Online dot */}
            <span
              style={{
                position:  "absolute",
                bottom:    1,
                right:     1,
                width:     8,
                height:    8,
                borderRadius: "50%",
                background: "var(--color-success)",
                border:    "1.5px solid var(--color-surface-raised)",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
              Soporte TapSur
            </p>
            <p style={{ fontSize: 11, color: "var(--color-success)" }}>
              En línea
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

          {/* Typing indicator */}
          {typing && (
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <div
                style={{
                  borderRadius: "16px 16px 16px 4px",
                  padding:      "10px 14px",
                  background:   "var(--color-surface-overlay)",
                  display:      "flex",
                  gap:          4,
                  alignItems:   "center",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width:     6,
                      height:    6,
                      borderRadius: "50%",
                      background: "var(--color-subtle)",
                      animation:  `lTyping 1.2s ease-in-out infinite`,
                      animationDelay: `${i * 0.2}s`,
                      display:    "inline-block",
                    }}
                  />
                ))}
              </div>
            </div>
          )}
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

      {/* Typing animation */}
      <style>{`
        @keyframes lTyping {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
}
