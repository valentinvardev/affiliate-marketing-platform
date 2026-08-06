import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";

const slideInput = z.object({
  url: z.string().url(),
  caption: z.string().trim().max(200).optional().nullable(),
});

export const feedRouter = createTRPCRouter({
  /** Feed cronológica. Devuelve si el usuario actual dio like, para pintar el botón. */
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const me = ctx.session.user.id;
      const rows = await ctx.db.feedPost.findMany({
        take: input?.limit ?? 30,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { username: true, role: true, avatarUrl: true } },
          slides: { orderBy: { position: "asc" } },
          likes: { where: { userId: me }, select: { id: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });
      return rows.map((p) => ({
        id: p.id,
        body: p.body,
        countryCode: p.countryCode,
        attachmentUrl: p.attachmentUrl,
        attachmentName: p.attachmentName,
        description: p.description,
        createdAt: p.createdAt,
        author: p.author.username,
        authorRole: p.author.role,
        authorAvatar: p.author.avatarUrl,
        slides: p.slides.map((s) => ({ id: s.id, url: s.url, caption: s.caption })),
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        likedByMe: p.likes.length > 0,
      }));
    }),

  /** Like/unlike. Devuelve el estado nuevo para que la UI lo confirme. */
  toggleLike: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const existing = await ctx.db.feedLike.findUnique({
        where: { postId_userId: { postId: input.postId, userId } },
      });
      if (existing) {
        await ctx.db.feedLike.delete({ where: { id: existing.id } });
        return { liked: false };
      }
      await ctx.db.feedLike.create({ data: { postId: input.postId, userId } });
      return { liked: true };
    }),

  comments: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.feedComment.findMany({
        where: { postId: input.postId },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { username: true, role: true, avatarUrl: true } } },
      });
      return rows.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        author: c.user.username,
        authorRole: c.user.role,
        authorAvatar: c.user.avatarUrl,
        mine: c.userId === ctx.session.user.id,
      }));
    }),

  addComment: protectedProcedure
    .input(z.object({ postId: z.string(), body: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.feedComment.create({
        data: { postId: input.postId, userId: ctx.session.user.id, body: input.body },
      });
    }),

  /** El autor borra el suyo; el admin, cualquiera. */
  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const c = await ctx.db.feedComment.findUniqueOrThrow({ where: { id: input.id } });
      if (ctx.session.user.role !== "admin" && c.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No es tu comentario" });
      }
      return ctx.db.feedComment.delete({ where: { id: input.id } });
    }),

  /* ── Publicar: solo admin ── */

  create: adminProcedure
    .input(z.object({
      body: z.string().trim().min(1).max(4000),
      countryCode: z.string().trim().length(2).optional().nullable(),
      attachmentUrl: z.string().url().optional().nullable(),
      attachmentName: z.string().trim().max(200).optional().nullable(),
      description: z.string().trim().max(8000).optional().nullable(),
      slides: z.array(slideInput).max(30).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { slides = [], countryCode, ...rest } = input;
      return ctx.db.feedPost.create({
        data: {
          ...rest,
          countryCode: countryCode ? countryCode.toUpperCase() : null,
          authorId: ctx.session.user.id,
          slides: { create: slides.map((s, i) => ({ ...s, position: i })) },
        },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.feedPost.delete({ where: { id: input.id } });
    }),
});
