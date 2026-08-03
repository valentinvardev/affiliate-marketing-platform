"use client";

import { useState } from "react";
import { MessageCircle, Send, Loader2, Trash2 } from "lucide-react";
import { api } from "@/trpc/react";
import { t } from "@/lib/i18n-client";

function ago(d: Date): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return t("recién");
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const day = Math.floor(h / 24);
  return day < 7 ? `${day} d` : new Date(d).toLocaleDateString();
}

/** Comentarios del tutorial: lista + caja para escribir. */
export function Comments({ tutorialId }: { tutorialId: string }) {
  const [body, setBody] = useState("");
  const utils = api.useUtils();
  const list = api.tutorial.comments.useQuery({ tutorialId });
  const add = api.tutorial.addComment.useMutation({
    onSuccess: async () => { setBody(""); await utils.tutorial.comments.invalidate({ tutorialId }); },
  });
  const del = api.tutorial.deleteComment.useMutation({
    onSuccess: async () => { await utils.tutorial.comments.invalidate({ tutorialId }); },
  });

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const v = body.trim();
    if (!v || add.isPending) return;
    add.mutate({ tutorialId, body: v });
  }

  return (
    <section className="rounded-xl p-4 md:p-5" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
        <span className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>{t("Comentarios")}</span>
        {list.data && (
          <span
            className="rounded-full px-2 py-0.5 text-[10px] tabular-nums"
            style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}
          >
            {list.data.length}
          </span>
        )}
      </div>

      {/* Caja de escritura */}
      <form onSubmit={submit} className="flex items-start gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(); }}
          placeholder={t("Escribí un comentario…")}
          rows={2}
          className="flex-1 resize-y rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", minHeight: 42 }}
        />
        <button
          type="submit"
          disabled={!body.trim() || add.isPending}
          title={t("Enviar")}
          className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>

      {/* Lista */}
      <div className="mt-4">
        {list.isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skel" style={{ height: 54, borderRadius: 10, animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        ) : !list.data?.length ? (
          <p className="py-6 text-center text-xs" style={{ color: "var(--color-subtle)" }}>
            {t("Sin comentarios todavía. Escribí el primero.")}
          </p>
        ) : (
          <div className="stagger space-y-2">
            {list.data.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-2.5 rounded-lg p-3"
                style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: "var(--color-surface-raised)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}
                >
                  {c.author.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>{c.author}</span>
                    {c.authorRole === "admin" && (
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: "var(--color-surface-raised)", color: "var(--color-subtle)", border: "1px solid var(--color-border)" }}>
                        admin
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: "var(--color-subtle)" }}>{ago(c.createdAt)}</span>
                    {c.mine && (
                      <button
                        type="button"
                        onClick={() => del.mutate({ id: c.id })}
                        title={t("Eliminar")}
                        className="ml-auto shrink-0 transition-opacity hover:opacity-70"
                        style={{ color: "var(--color-subtle)" }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
                    {c.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
