"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Refresca los datos del server component periódicamente para dar sensación
 * de "estadísticas en tiempo real". Pausa mientras la pestaña está oculta.
 * Como AnimatedNumber conserva su valor previo, cada refresco anima del dato
 * anterior al nuevo en lugar de saltar.
 */
export function AutoRefresh({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      router.refresh();
    };
    const t = setInterval(tick, intervalMs);
    return () => clearInterval(t);
  }, [router, intervalMs]);
  return null;
}
