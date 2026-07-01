import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { fetchTiktokOembed, isTiktokCarousel } from "@/lib/tiktok";
import { commentsForLanguage } from "@/lib/spark-comments";
import { LOCALES } from "@/lib/locales";

export const sparksRouter = createTRPCRouter({
  /* ── Catálogo (todos lo ven, con el sparkCode visible para copiar) ── */
  list: protectedProcedure
    .input(z.object({ country: z.string().optional(), language: z.string().optional(), kind: z.enum(["WH", "BH"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const me = ctx.session.user.id;
      const sparks = await ctx.db.spark.findMany({
        where: {
          status: { not: "disabled" },
          ...(input?.kind ? { kind: input.kind } : {}),
          ...(input?.language ? { language: input.language } : {}),
          ...(input?.country ? { countryCode: input.country } : {}),
        },
        orderBy: { createdAt: "desc" },
      });
      const ids = sparks.map((s) => s.id);
      const agg = await ratingsAgg(ctx.db, ids);
      const mine = ids.length ? await ctx.db.sparkRating.findMany({ where: { userId: me, sparkId: { in: ids } }, select: { sparkId: true, stars: true } }) : [];
      const byMe = new Map(mine.map((r) => [r.sparkId, r.stars]));
      return sparks.map((s) => ({ ...s, avgRating: agg.get(s.id)?.avg ?? 0, ratingsCount: agg.get(s.id)?.count ?? 0, myStars: byMe.get(s.id) ?? 0 }));
    }),

  rate: protectedProcedure
    .input(z.object({ sparkId: z.string(), stars: z.number().int().min(1).max(5), comment: z.string().optional() }))
    .mutation(({ ctx, input }) => {
      const me = ctx.session.user.id;
      return ctx.db.sparkRating.upsert({
        where: { sparkId_userId: { sparkId: input.sparkId, userId: me } },
        create: { sparkId: input.sparkId, userId: me, stars: input.stars, comment: input.comment?.trim() || null },
        update: { stars: input.stars, comment: input.comment?.trim() || null },
      });
    }),

  /* ── Admin ── */
  manage: adminProcedure.query(async ({ ctx }) => {
    const sparks = await ctx.db.spark.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { reports: true } } },
    });
    const agg = await ratingsAgg(ctx.db, sparks.map((s) => s.id));
    return sparks.map((s) => ({
      ...s,
      avgRating: agg.get(s.id)?.avg ?? 0,
      ratingsCount: agg.get(s.id)?.count ?? 0,
      reportsCount: s._count.reports,
    }));
  }),

  create: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      tiktokUrl: z.string().optional(), // opcional: se puede subir sin link
      sparkCode: z.string().min(1),
      language: z.string().min(1),
      kind: z.enum(["WH", "BH"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const url = input.tiktokUrl?.trim() || null;
      const oe = url && /^https?:\/\//.test(url) ? await fetchTiktokOembed(url) : { thumbnailUrl: null, authorName: null };
      const loc = LOCALES.find((l) => l.code === input.language);
      return ctx.db.spark.create({
        data: {
          createdById: ctx.session.user.id,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          tiktokUrl: url,
          sparkCode: input.sparkCode.trim(),
          kind: input.kind,
          language: input.language,
          countryCode: loc?.countryCode ?? input.language.slice(0, 2).toUpperCase(),
          thumbnailUrl: oe.thumbnailUrl, authorName: oe.authorName,
          isCarousel: url ? isTiktokCarousel(url) : false,
        },
      });
    }),

  update: adminProcedure
    .input(z.object({ id: z.string(), title: z.string().min(1), description: z.string().optional(), sparkCode: z.string().min(1), language: z.string().min(1), kind: z.enum(["WH", "BH"]) }))
    .mutation(async ({ ctx, input }) => {
      const loc = LOCALES.find((l) => l.code === input.language);
      return ctx.db.spark.update({
        where: { id: input.id },
        data: {
          title: input.title.trim(),
          description: input.description?.trim() || null,
          sparkCode: input.sparkCode.trim(),
          kind: input.kind,
          language: input.language,
          countryCode: loc?.countryCode ?? input.language.slice(0, 2).toUpperCase(),
        },
      });
    }),

  setUsable: adminProcedure
    .input(z.object({ id: z.string(), usable: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.db.spark.update({ where: { id: input.id }, data: { status: input.usable ? "available" : "disabled" } }),
    ),

  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => ctx.db.spark.delete({ where: { id: input.id } })),

  commentBank: adminProcedure
    .input(z.object({ language: z.string() }))
    .query(({ input }) => commentsForLanguage(input.language)),

  boost: adminProcedure
    .input(z.object({ sparkId: z.string(), interactions: z.record(z.number()), comments: z.array(z.string()) }))
    .mutation(({ ctx, input }) =>
      ctx.db.sparkBoost.create({
        data: {
          sparkId: input.sparkId,
          createdById: ctx.session.user.id,
          interactions: input.interactions,
          comments: input.comments.map((c) => c.trim()).filter(Boolean),
        },
      }),
    ),

  feedback: adminProcedure
    .input(z.object({ sparkId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rs = await ctx.db.sparkRating.findMany({ where: { sparkId: input.sparkId }, orderBy: { createdAt: "desc" } });
      const uids = [...new Set(rs.map((r) => r.userId))];
      const users = uids.length ? await ctx.db.user.findMany({ where: { id: { in: uids } }, select: { id: true, username: true } }) : [];
      const uname = new Map(users.map((u) => [u.id, u.username]));
      return rs.map((r) => ({ id: r.id, stars: r.stars, comment: r.comment, username: uname.get(r.userId) ?? "—", createdAt: r.createdAt }));
    }),

  /* ── Reportes ── */
  report: protectedProcedure
    .input(z.object({ sparkId: z.string(), reason: z.enum(["no_interactions", "review_not_approved", "other"]), note: z.string().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.db.sparkReport.create({ data: { sparkId: input.sparkId, userId: ctx.session.user.id, reason: input.reason, note: input.note?.trim() || null } }),
    ),

  reports: adminProcedure
    .input(z.object({ sparkId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rs = await ctx.db.sparkReport.findMany({ where: { sparkId: input.sparkId }, orderBy: { createdAt: "desc" } });
      const uids = [...new Set(rs.map((r) => r.userId))];
      const users = uids.length ? await ctx.db.user.findMany({ where: { id: { in: uids } }, select: { id: true, username: true } }) : [];
      const uname = new Map(users.map((u) => [u.id, u.username]));
      return rs.map((r) => ({ id: r.id, reason: r.reason, note: r.note, status: r.status, username: uname.get(r.userId) ?? "—", createdAt: r.createdAt }));
    }),

  resolveReport: adminProcedure
    .input(z.object({ id: z.string(), resolved: z.boolean() }))
    .mutation(({ ctx, input }) => ctx.db.sparkReport.update({ where: { id: input.id }, data: { status: input.resolved ? "resolved" : "open" } })),
});

/* ── helpers ── */
async function ratingsAgg(db: typeof import("@/server/db").db, ids: string[]) {
  if (!ids.length) return new Map<string, { avg: number; count: number }>();
  const rows = await db.sparkRating.findMany({ where: { sparkId: { in: ids } }, select: { sparkId: true, stars: true } });
  const acc = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const cur = acc.get(r.sparkId) ?? { sum: 0, count: 0 };
    cur.sum += r.stars; cur.count++;
    acc.set(r.sparkId, cur);
  }
  return new Map([...acc].map(([k, v]) => [k, { avg: v.count ? v.sum / v.count : 0, count: v.count }]));
}
