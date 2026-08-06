import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";

/** Claves en AppConfig para el servicio por defecto de cada tipo. */
const KEYS = {
  comments: "smm_default_service_comments",
  likes: "smm_default_service_likes",
  saves: "smm_default_service_saves",
} as const;

const kindEnum = z.enum(["comments", "likes", "saves"]);

export const interactionsRouter = createTRPCRouter({
  /**
   * Servicio por defecto de cada tipo. Lo elige el admin; los usuarios normales
   * no pueden cambiarlo, así que la UI les muestra el fijado y sin selector.
   */
  defaults: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.appConfig.findMany({
      where: { key: { in: Object.values(KEYS) } },
    });
    const byKey = new Map(rows.map((r) => [r.key, r.value]));
    return {
      comments: byKey.get(KEYS.comments) ?? null,
      likes: byKey.get(KEYS.likes) ?? null,
      saves: byKey.get(KEYS.saves) ?? null,
    };
  }),

  setDefault: adminProcedure
    .input(z.object({ kind: kindEnum, service: z.string().min(1).max(20) }))
    .mutation(async ({ ctx, input }) => {
      const key = KEYS[input.kind];
      await ctx.db.appConfig.upsert({
        where: { key },
        create: { key, value: input.service },
        update: { value: input.service },
      });
      return { ok: true };
    }),

  /* ── Listas de comentarios ── */

  presets: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.commentPreset.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, comments: true },
    });
  }),

  createPreset: adminProcedure
    .input(z.object({
      name: z.string().trim().min(1).max(80),
      comments: z.array(z.string().trim().min(1).max(500)).min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.commentPreset.create({
        data: { name: input.name, comments: input.comments, createdById: ctx.session.user.id },
      });
    }),

  updatePreset: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().trim().min(1).max(80).optional(),
      comments: z.array(z.string().trim().min(1).max(500)).min(1).max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      return ctx.db.commentPreset.update({ where: { id }, data: rest });
    }),

  deletePreset: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.commentPreset.delete({ where: { id: input.id } });
    }),
});
