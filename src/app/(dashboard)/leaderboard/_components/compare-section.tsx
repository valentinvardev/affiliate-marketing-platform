"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Users, Loader2, ChevronUp } from "lucide-react";

const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

const MEDAL: Record<number, string> = { 1: "#facc15", 2: "#cbd5e1", 3: "#d6a06a" };

export function CompareSection() {
  const [open, setOpen] = useState(false);
  const q = api.leaderboard.ranking.useQuery(undefined, { enabled: open });

  if (!open) {
    return (
      <div className="mt-10 flex flex-col items-center">
        <button type="button" onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}>
          <Users className="h-4 w-4" /> Quiero compararme
        </button>
        <p className="mt-2 text-[11px]" style={{ color: "var(--color-subtle)" }}>Ver el ranking del equipo (revenue de hoy).</p>
      </div>
    );
  }

  const ranking = q.data?.ranking ?? [];
  const myRank = q.data?.myRank ?? null;

  return (
    <div className="mt-10 w-full max-w-lg">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-subtle)" }}>Leaderboard · hoy</span>
        {myRank && <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-muted-foreground)" }}>Estás #{myRank}</span>}
        <button type="button" onClick={() => setOpen(false)} className="ml-auto inline-flex items-center gap-1 text-[11px] transition-opacity hover:opacity-70" style={{ color: "var(--color-muted-foreground)" }}>
          <ChevronUp className="h-3.5 w-3.5" /> Ocultar
        </button>
      </div>

      {q.isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-subtle)" }} /></div>
      ) : ranking.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: "var(--color-subtle)" }}>Sin participantes todavía.</p>
      ) : (
        <ul className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)" }}>
          {ranking.map((r, i) => {
            const medal = MEDAL[r.rank];
            return (
              <li key={r.userId}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--color-border)",
                  background: r.isMe ? "var(--color-surface-overlay)" : "var(--color-surface)",
                }}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums"
                  style={{ background: medal ? medal : "var(--color-surface-raised)", color: medal ? "#000" : "var(--color-muted-foreground)" }}>
                  {r.rank}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                  {r.username}{r.isMe && <span className="ml-1.5 text-[11px]" style={{ color: "var(--color-subtle)" }}>(vos)</span>}
                </span>
                <span className="shrink-0 text-[11px]" style={{ color: "var(--color-subtle)" }}>{r.conversions} conv</span>
                <span className="shrink-0 tabular-nums text-sm font-semibold" style={{ fontFamily: "var(--font-brand)", color: r.isMe ? "var(--color-success)" : "var(--color-foreground)" }}>
                  {usd(r.revenue)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
