"use client";

import { useState } from "react";
import ReactCountryFlag from "react-country-flag";
import {
  Newspaper, Heart, MessageCircle, Send, Loader2, Trash2, Paperclip,
  ExternalLink, Layers,
} from "lucide-react";
import { api } from "@/trpc/react";
import { AngleModal, type Slide } from "@/components/feed/angle-modal";
import { FeedComposer } from "@/components/feed/feed-composer";
import { t } from "@/lib/i18n-client";
import { Avatar } from "@/components/ui/avatar";

type Post = {
  id: string;
  body: string;
  countryCode: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  description: string | null;
  createdAt: Date;
  author: string;
  authorRole: string;
  authorAvatar: string | null;
  slides: Slide[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

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

export function FeedView({ isAdmin }: { isAdmin: boolean }) {
  const { data, isLoading } = api.feed.list.useQuery();
  const [openPost, setOpenPost] = useState<Post | null>(null);
  const posts = (data ?? []) as Post[];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 px-4 md:px-8" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <Newspaper className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
        <h1 className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{t("Feed")}</h1>
        {!isLoading && posts.length > 0 && (
          <span
            className="ml-2 rounded-full px-2 py-0.5 text-[11px] tabular-nums"
            style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)", border: "1px solid var(--color-border)" }}
          >
            {posts.length}
          </span>
        )}
      </header>

      <main className="flex-1 px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-2xl">
          {isAdmin && <FeedComposer />}

          {isLoading ? (
            <FeedSkeleton />
          ) : posts.length === 0 ? (
            <Empty isAdmin={isAdmin} />
          ) : (
            <div className="stagger space-y-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} isAdmin={isAdmin} onOpen={() => setOpenPost(p)} />
              ))}
            </div>
          )}
        </div>
      </main>

      <AngleModal
        open={!!openPost}
        onClose={() => setOpenPost(null)}
        title={openPost?.body.slice(0, 80) ?? ""}
        description={openPost?.description ?? null}
        slides={openPost?.slides ?? []}
        countryCode={openPost?.countryCode ?? null}
      />
    </div>
  );
}

function PostCard({ post, isAdmin, onOpen }: { post: Post; isAdmin: boolean; onOpen: () => void }) {
  const utils = api.useUtils();
  const [liked, setLiked] = useState(post.likedByMe);
  const [count, setCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);

  const like = api.feed.toggleLike.useMutation({
    onError: () => { setLiked(post.likedByMe); setCount(post.likeCount); },
  });
  const del = api.feed.delete.useMutation({
    onSuccess: async () => { await utils.feed.list.invalidate(); },
  });

  function toggle() {
    // Optimista: el corazón responde al toque, no al round-trip.
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    like.mutate({ postId: post.id });
  }

  const hasAngle = post.slides.length > 0 || !!post.description;

  return (
    <article className="rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
      {/* Cabecera estilo red social */}
      <div className="flex items-center gap-2.5">
        <Avatar name={post.author} url={post.authorAvatar} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{post.author}</span>
            {post.authorRole === "admin" && (
              <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ background: "var(--color-surface-overlay)", color: "var(--color-subtle)", border: "1px solid var(--color-border)" }}>
                admin
              </span>
            )}
            <span className="text-[11px]" style={{ color: "var(--color-subtle)" }}>· {ago(post.createdAt)}</span>
          </div>
        </div>
        {post.countryCode && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1"
            style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
            <ReactCountryFlag countryCode={post.countryCode} svg style={{ width: "1.2em", height: "0.9em", borderRadius: 2 }} />
            <span className="text-[10px] font-semibold" style={{ color: "var(--color-muted-foreground)" }}>{post.countryCode}</span>
          </span>
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={() => { if (confirm(t("¿Eliminar este post?"))) del.mutate({ id: post.id }); }}
            title={t("Eliminar")}
            className="shrink-0 transition-opacity hover:opacity-70"
            style={{ color: "var(--color-subtle)" }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Cuerpo */}
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>
        {post.body}
      </p>

      {/* Adjunto visible */}
      {post.attachmentUrl && (
        <a
          href={post.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block overflow-hidden rounded-lg transition-opacity hover:opacity-95"
          style={{ border: "1px solid var(--color-border)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.attachmentUrl} alt={post.attachmentName ?? ""} className="w-full object-cover" style={{ maxHeight: 380 }} />
          <span className="flex items-center gap-1.5 px-3 py-2 text-[11px]"
            style={{ background: "var(--color-surface-overlay)", color: "var(--color-muted-foreground)" }}>
            <Paperclip className="h-3 w-3 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{post.attachmentName ?? t("Adjunto")}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </span>
        </a>
      )}

      {/* Abrir el ángulo */}
      {hasAngle && (
        <button
          type="button"
          onClick={onOpen}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          <Layers className="h-3.5 w-3.5" />
          {t("Abrir")}
          {post.slides.length > 0 && (
            <span className="rounded px-1.5 py-0.5 text-[10px] tabular-nums" style={{ background: "rgba(0,0,0,0.15)" }}>
              {post.slides.length}
            </span>
          )}
        </button>
      )}

      {/* Acciones */}
      <div className="mt-3 flex items-center gap-4 border-t pt-2.5" style={{ borderColor: "var(--color-border)" }}>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={liked}
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-transform active:scale-95"
          style={{ color: liked ? "var(--color-error)" : "var(--color-muted-foreground)" }}
        >
          <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} style={{ transition: "transform .18s cubic-bezier(.2,.8,.2,1)", transform: liked ? "scale(1.12)" : "none" }} />
          <span className="tabular-nums">{count}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{post.commentCount}</span>
        </button>
      </div>

      {showComments && <Comments postId={post.id} />}
    </article>
  );
}

function Comments({ postId }: { postId: string }) {
  const utils = api.useUtils();
  const list = api.feed.comments.useQuery({ postId });
  const [body, setBody] = useState("");
  const add = api.feed.addComment.useMutation({
    onSuccess: async () => { setBody(""); await Promise.all([utils.feed.comments.invalidate({ postId }), utils.feed.list.invalidate()]); },
  });
  const del = api.feed.deleteComment.useMutation({
    onSuccess: async () => { await Promise.all([utils.feed.comments.invalidate({ postId }), utils.feed.list.invalidate()]); },
  });

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const v = body.trim();
    if (!v || add.isPending) return;
    add.mutate({ postId, body: v });
  }

  return (
    <div className="enter-down mt-3 border-t pt-3" style={{ borderColor: "var(--color-border)" }}>
      <form onSubmit={submit} className="flex items-start gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("Escribí un comentario…")}
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
          style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
        />
        <button
          type="submit"
          disabled={!body.trim() || add.isPending}
          title={t("Enviar")}
          className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-foreground)", color: "var(--color-background)" }}
        >
          {add.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </form>

      {list.isLoading ? (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skel" style={{ height: 40, borderRadius: 8 }} />)}
        </div>
      ) : !list.data?.length ? (
        <p className="mt-3 text-center text-[11px]" style={{ color: "var(--color-subtle)" }}>{t("Sin comentarios todavía.")}</p>
      ) : (
        <div className="stagger mt-3 space-y-2">
          {list.data.map((c) => (
            <div key={c.id} className="flex items-start gap-2 rounded-lg px-3 py-2"
              style={{ background: "var(--color-surface-overlay)", border: "1px solid var(--color-border)" }}>
              <Avatar name={c.author} url={c.authorAvatar} size={24} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold" style={{ color: "var(--color-foreground)" }}>{c.author}</span>
                  <span className="text-[10px]" style={{ color: "var(--color-subtle)" }}>{ago(c.createdAt)}</span>
                  {c.mine && (
                    <button type="button" onClick={() => del.mutate({ id: c.id })} title={t("Eliminar")}
                      className="ml-auto shrink-0 transition-opacity hover:opacity-70" style={{ color: "var(--color-subtle)" }}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-xs" style={{ color: "var(--color-muted-foreground)" }}>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl py-20 text-center" style={{ border: "1px dashed var(--color-border)" }}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--color-surface-raised)" }}>
        <Newspaper className="h-5 w-5" style={{ color: "var(--color-muted-foreground)" }} />
      </div>
      <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{t("Todavía no hay posts")}</p>
      <p className="mt-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        {isAdmin ? t("Publicá el primer ángulo desde el cuadro de arriba.") : t("El admin todavía no publicó ángulos.")}
      </p>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="stagger space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl p-4" style={{ border: "1px solid var(--color-border)", background: "var(--color-surface-raised)" }}>
          <div className="flex items-center gap-2.5">
            <div className="skel" style={{ width: 36, height: 36, borderRadius: 999 }} />
            <div className="flex-1">
              <div className="skel" style={{ height: 12, width: "35%", borderRadius: 5 }} />
              <div className="skel" style={{ height: 10, width: "20%", borderRadius: 5, marginTop: 6 }} />
            </div>
            <div className="skel" style={{ width: 44, height: 24, borderRadius: 6 }} />
          </div>
          <div className="skel" style={{ height: 12, width: "92%", borderRadius: 5, marginTop: 14 }} />
          <div className="skel" style={{ height: 12, width: "70%", borderRadius: 5, marginTop: 7 }} />
          <div className="skel" style={{ height: 190, borderRadius: 10, marginTop: 12 }} />
          <div className="mt-3 flex gap-4">
            <div className="skel" style={{ height: 14, width: 42, borderRadius: 5 }} />
            <div className="skel" style={{ height: 14, width: 42, borderRadius: 5 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
