"use client";

import { useEffect, useRef, useState } from "react";

/** Número que cuenta desde 0 (o desde el valor previo) hasta el valor actual, con fade desde arriba. */
export function AnimatedNumber({
  value, format, duration = 850, className, style,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") { setDisplay(value); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDisplay(value); fromRef.current = value; return; }
    const from = fromRef.current;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = value;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); fromRef.current = value; };
  }, [value, duration]);

  return (
    <span className={className} style={{ display: "inline-block", animation: "numRise .45s ease both", ...style }}>
      {format ? format(display) : Math.round(display).toLocaleString()}
    </span>
  );
}
