"use client";

import { useEffect } from "react";

/**
 * Reveal on-scroll para la landing v2. Progressive enhancement:
 *  - sin JS, todo se ve normal (no ocultamos nada en CSS).
 *  - respeta prefers-reduced-motion.
 *  - solo oculta lo que está debajo del fold (sin flash) y lo anima al entrar.
 *  - fallback: revela todo a los 4s por las dudas.
 */
export function V2Reveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!els.length) return;

    const io = new IntersectionObserver((entries, obs) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement;
          el.style.opacity = "";
          el.style.animation = "v2up .65s cubic-bezier(.2,.7,.2,1) both";
          obs.unobserve(el);
        }
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });

    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) {
        el.style.animation = "v2up .6s cubic-bezier(.2,.7,.2,1) both";
      } else {
        el.style.opacity = "0";
        io.observe(el);
      }
    }

    const t = window.setTimeout(() => {
      for (const el of els) if (el.style.opacity === "0") { el.style.opacity = ""; el.style.animation = "v2up .5s both"; }
    }, 4000);

    return () => { io.disconnect(); window.clearTimeout(t); };
  }, []);

  return null;
}
