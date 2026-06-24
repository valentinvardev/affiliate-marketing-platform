"use client";

import { useState, useEffect } from "react";

/** Reloj en vivo — textura "command center". */
export function LiveClock() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setT(fmt());
    const id = setInterval(() => setT(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>{t}</span>;
}

/** Botón que abre el chat global (dispara el evento que escucha LiveChatProvider). */
export function OpenChatButton({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("chat:open"))}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}
