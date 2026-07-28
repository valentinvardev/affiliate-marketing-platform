"use client";

import { useEffect } from "react";

type Ttq = { track?: (event: string, props?: Record<string, unknown>) => void };

/**
 * Dispara UN solo evento `ClickButton` al TikTok Pixel cuando el visitante
 * toca cualquier CTA de la landing (`a[data-cta]`).
 *
 * Notas:
 *  - Se cuenta como máximo una vez por pageview, así que tocar dos CTAs (o el
 *    mismo dos veces) no infla el evento.
 *  - NO chequea `defaultPrevented` a propósito: cuando la pregunta de edad
 *    está activa intercepta el click con preventDefault, y ese tap igual es
 *    un click en el botón que queremos contar.
 */
export function TikTokCtaTracker() {
  useEffect(() => {
    let sent = false;

    function onClick(e: MouseEvent) {
      if (sent) return;
      const el = e.target as HTMLElement | null;
      if (!el?.closest?.("a[data-cta]")) return;
      sent = true;
      const ttq = (window as unknown as { ttq?: Ttq }).ttq;
      ttq?.track?.("ClickButton");
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
