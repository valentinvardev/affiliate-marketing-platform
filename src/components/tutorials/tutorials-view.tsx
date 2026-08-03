"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GraduationCap, ChevronLeft, Play, ListVideo, MessageCircle, Clock, Search } from "lucide-react";
import { api } from "@/trpc/react";
import { VideoPlayer, fmtTime, type Chapter } from "@/components/tutorials/video-player";
import { ChapterList } from "@/components/tutorials/chapter-list";
import { Comments } from "@/components/tutorials/comments";
import { t } from "@/lib/i18n-client";

type Tut = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  posterUrl: string | null;
  durationSec: number | null;
  category: string | null;
  chapters: Chapter[];
  _count: { comments: number };
};

export function TutorialsView() {
  const { data, isLoading } = api.tutorial.list.useQuery();
  const [openId, setOpenId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [q, setQ] = useState("");

  const tutorials = (data ?? []) as Tut[];
  const open = tutorials.find((x) => x.id === openId) ?? null;

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const x of tutorials) if (x.category) set.add(x.category);
    return [...set].sort();
  }, [tutorials]);
  const [cat, setCat] = useState<string | null>(null);

  const filtered = tutorials.filter((x) => {
    if (cat && x.category !== cat) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return x.title.toLowerCase().includes(s)
      || (x.description ?? "").toLowerCase().includes(s)
      || x.chapters.some((c) => c.title.toLowerCase().includes(s));
  });

  /* Entrar / salir de un video con animación de salida antes de desmontar */
  const enter = useCallback((id: string) => {
    setLeaving(true);
    window.setTimeout(() => { setOpenId(id); setLeaving(false); window.scrollTo({ top: 0 }); }, 150);
  }, []);
  const back = useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => { setOpenId(null); setLeaving(false); }, 150);
  }, []);

  /* Escape vuelve al índice */
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA)$/.test(el.tagName)) return;
      if (e.key === "Escape") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId, back]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        {open ? (
          <button
            type="button"
            onClick={back}
            className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-60"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {t("Tutoriales")}
          </button>
        ) : (
          <>
            <GraduationCap className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
            <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{t("Tutoriales")}</h1>
          </>
        )}
        {open && (
          <>
            <span style={{ color: "var(--color-border)" }}>/</span>
            <span className="truncate text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{open.title}</span>
          </>
        )}
        {!open && !isLoading && tutorials.length > 0 && (
          <span
            className="ml-2 rounded-full px-2 py-0.5 text-[11px] tabular-nums"
            style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}
          >
            {tutorials.length}
          </span>
        )}
      </header>

      <main className="flex-1 px-4 py-6 md:px-8">
        {isLoading ? (
          <IndexSkeleton />
        ) : open ? (
          <PlayerView key={open.id} tut={open} className={leaving ? "tut-leave" : "tut-enter"} />
        ) : (
          <div className={leaving ? "tut-leave" : "tut-back"}>
            {tutorials.length === 0 ? (
              <Empty />
            ) : (
              <>
                {/* Buscador + categorías */}
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <div
                    className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg px-3 py-2"
                    style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}
                  >
                    <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-subtle)" }} />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={t("Buscar tutorial o capítulo…")}
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{ color: "var(--color-foreground)" }}
                    />
                  </div>
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <Chip on={cat === null} onClick={() => setCat(null)}>{t("Todos")}</Chip>
                      {categories.map((c) => (
                        <Chip key={c} on={cat === c} onClick={() => setCat(c)}>{c}</Chip>
                      ))}
                    </div>
                  )}
                </div>

                {filtered.length === 0 ? (
                  <p className="py-16 text-center text-sm" style={{ color: "var(--color-subtle)" }}>
                    {t("Sin resultados.")}
                  </p>
                ) : (
                  <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((x) => <Card key={x.id} tut={x} onOpen={() => enter(x.id)} />)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

/* ── Vista de un video ── */
function PlayerView({ tut, className }: { tut: Tut; className: string }) {
  const [seek, setSeek] = useState<{ sec: number; nonce: number } | null>(null);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dur, setDur] = useState(tut.durationSec ?? 0);

  return (
    <div className={className}>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <VideoPlayer
            src={tut.videoUrl}
            poster={tut.posterUrl}
            chapters={tut.chapters}
            seekTo={seek}
            onDuration={setDur}
            onChapterChange={setActiveIdx}
          />
          <h2 className="mt-4 text-lg font-semibold" style={{ color: "var(--color-foreground)" }}>{tut.title}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px]" style={{ color: "var(--color-subtle)" }}>
            {dur > 0 && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(dur)}</span>}
            {tut.chapters.length > 0 && (
              <span className="inline-flex items-center gap-1"><ListVideo className="h-3 w-3" />{tut.chapters.length} {t("capítulos")}</span>
            )}
            {tut.category && (
              <span className="rounded px-1.5 py-0.5" style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
                {tut.category}
              </span>
            )}
          </div>
          {tut.description && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--color-muted-foreground)" }}>
              {tut.description}
            </p>
          )}
        </div>

        {/* Índice a la derecha */}
        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)]">
          <ChapterList
            chapters={tut.chapters}
            activeIdx={activeIdx}
            duration={dur}
            onSeek={(sec) => setSeek({ sec, nonce: Date.now() })}
          />
        </div>
      </div>

      <div className="mt-5">
        <Comments tutorialId={tut.id} />
      </div>
    </div>
  );
}

/* ── Tarjeta del índice ── */
function Card({ tut, onOpen }: { tut: Tut; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="tut-card flex flex-col overflow-hidden rounded-xl text-left"
      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
    >
      <div
        className="tut-thumb relative w-full overflow-hidden"
        style={{ aspectRatio: "16 / 9", background: "var(--color-surface-overlay)" }}
      >
        {tut.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tut.posterUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Play className="h-7 w-7" style={{ color: "var(--color-subtle)" }} />
          </span>
        )}
        {/* overlay de play */}
        <span
          className="tut-play absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.28)", backdropFilter: "blur(4px)" }}
        >
          <Play className="h-5 w-5" style={{ color: "#fff", marginLeft: 3 }} fill="currentColor" />
        </span>
        {tut.durationSec ? (
          <span
            className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
            style={{ background: "rgba(0,0,0,0.75)", color: "#fff" }}
          >
            {fmtTime(tut.durationSec)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <span className="line-clamp-2 text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{tut.title}</span>
        {tut.description && (
          <span className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--color-muted-foreground)" }}>{tut.description}</span>
        )}
        <span className="mt-auto flex items-center gap-3 pt-2.5 text-[11px]" style={{ color: "var(--color-subtle)" }}>
          {tut.chapters.length > 0 && (
            <span className="inline-flex items-center gap-1"><ListVideo className="h-3 w-3" />{tut.chapters.length}</span>
          )}
          <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{tut._count.comments}</span>
          {tut.category && <span className="ml-auto truncate">{tut.category}</span>}
        </span>
      </div>
    </button>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
      style={{
        background: on ? "var(--color-surface-overlay)" : "transparent",
        border: `1px solid ${on ? "var(--color-border-focus)" : "var(--color-border)"}`,
        color: on ? "var(--color-foreground)" : "var(--color-muted-foreground)",
      }}
    >
      {children}
    </button>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl py-24 text-center" style={{ border: "1px dashed var(--color-border)" }}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--color-surface-raised)" }}>
        <GraduationCap className="h-5 w-5" style={{ color: "var(--color-muted-foreground)" }} />
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{t("Todavía no hay tutoriales")}</p>
      <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        {t("El admin puede subirlos desde Admin → Tutoriales.")}
      </p>
    </div>
  );
}

/** Skeleton del índice: replica la anatomía real de la tarjeta. */
function IndexSkeleton() {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="skel" style={{ height: 38, borderRadius: 8, flex: 1, minWidth: 220 }} />
        <div className="skel" style={{ width: 70, height: 32, borderRadius: 8 }} />
        <div className="skel" style={{ width: 90, height: 32, borderRadius: 8 }} />
      </div>
      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
            <div className="skel" style={{ aspectRatio: "16 / 9", borderRadius: 0 }} />
            <div className="p-3.5">
              <div className="skel" style={{ height: 13, width: "80%", borderRadius: 5 }} />
              <div className="skel" style={{ height: 11, width: "95%", borderRadius: 5, marginTop: 9 }} />
              <div className="skel" style={{ height: 11, width: "60%", borderRadius: 5, marginTop: 6 }} />
              <div className="mt-3 flex gap-3">
                <div className="skel" style={{ height: 10, width: 34, borderRadius: 5 }} />
                <div className="skel" style={{ height: 10, width: 34, borderRadius: 5 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
