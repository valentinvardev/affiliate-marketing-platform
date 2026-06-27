"use client";

import { api } from "@/trpc/react";
import { AlertTriangle } from "lucide-react";

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** Topbar de advertencia cuando se alcanza el límite de gasto diario de VCC. */
export function SpendLimitBar() {
  const { data } = api.limits.status.useQuery(undefined, {
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  if (!data?.reached) return null;

  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-center gap-2 px-4 py-2 text-center text-xs font-semibold"
      style={{ background: "var(--color-error)", color: "#fff", animation: "lpFade .3s ease" }}
      role="alert"
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>
        Límite de gasto diario de tarjetas virtuales alcanzado ({usd(data.dailyCap)}). Tus VCCs fueron pausadas hasta mañana.
      </span>
    </div>
  );
}
