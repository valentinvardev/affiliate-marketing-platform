"use client";

import { useEffect, useState } from "react";

/** Barra de progreso que se llena de 0% hasta `pct` al aparecer / cambiar. */
export function AnimatedBar({
  pct, color, track = "var(--color-surface-overlay)", height = 8, radius = 999,
}: {
  pct: number;
  color: string;
  track?: string;
  height?: number;
  radius?: number;
}) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.max(0, Math.min(100, pct))), 60);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div style={{ height, borderRadius: radius, background: track, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: radius, transition: "width .85s cubic-bezier(.2,.7,.2,1)" }} />
    </div>
  );
}
