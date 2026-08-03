"use client";

import { ListVideo, Play } from "lucide-react";
import { fmtTime, type Chapter } from "@/components/tutorials/video-player";
import { t } from "@/lib/i18n-client";

/** Índice del video: capítulos clicables, con el activo resaltado. */
export function ChapterList({
  chapters, activeIdx, onSeek, duration,
}: {
  chapters: Chapter[];
  activeIdx: number;
  onSeek: (sec: number) => void;
  duration: number;
}) {
  return (
    <aside
      className="flex min-h-0 flex-col overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}
    >
      <div
        className="flex shrink-0 items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <ListVideo className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
        <span className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>
          {t("Índice")}
        </span>
        <span
          className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums"
          style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}
        >
          {chapters.length}
        </span>
      </div>

      {chapters.length === 0 ? (
        <div className="px-4 py-10 text-center">
          <p className="text-xs" style={{ color: "var(--color-subtle)" }}>
            {t("Este video no tiene índice.")}
          </p>
        </div>
      ) : (
        <div className="stagger min-h-0 flex-1 overflow-y-auto py-1">
          {chapters.map((c, i) => {
            const on = i === activeIdx;
            const pct = duration ? (c.timeSec / duration) * 100 : 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSeek(c.timeSec)}
                aria-current={on}
                className="group relative flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors"
                style={{ background: on ? "var(--color-surface-overlay)" : "transparent" }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "rgba(255,255,255,0.035)"; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
              >
                {/* barra de activo */}
                <span
                  aria-hidden
                  style={{
                    position: "absolute", left: 0, top: 4, bottom: 4, width: 2, borderRadius: 2,
                    background: "var(--color-foreground)",
                    transform: on ? "scaleY(1)" : "scaleY(0)",
                    transformOrigin: "center",
                    transition: "transform .22s cubic-bezier(.2,.7,.2,1)",
                  }}
                />
                <span
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded"
                  style={{
                    background: on ? "var(--color-foreground)" : "var(--color-surface-overlay)",
                    color: on ? "var(--color-background)" : "var(--color-subtle)",
                    border: on ? "none" : "1px solid var(--color-border)",
                    transition: "background .2s ease, color .2s ease",
                  }}
                >
                  <Play className="h-2.5 w-2.5" fill="currentColor" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-xs leading-snug"
                    style={{ color: on ? "var(--color-foreground)" : "var(--color-muted-foreground)", fontWeight: on ? 600 : 500 }}
                  >
                    {c.title}
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] tabular-nums" style={{ color: "var(--color-subtle)", fontFamily: "var(--font-mono)" }}>
                      {fmtTime(c.timeSec)}
                    </span>
                    <span className="h-px flex-1" style={{ background: "var(--color-border)" }}>
                      <span className="block h-px" style={{ width: `${pct}%`, background: "var(--color-subtle)" }} />
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
