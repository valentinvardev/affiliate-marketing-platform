import { z } from "zod";
import { createTRPCRouter, adminProcedure, protectedProcedure } from "@/server/api/trpc";
import { IA_KEYS, IA_DEFAULTS, getIaIdentity } from "@/lib/ia-identity";

const SUITE_COOKIE_KEY = "taprain_suite_cookie";

export const configRouter = createTRPCRouter({
  /** Identidad de la IA: la lee cualquier logueado para pintar chat y asistente. */
  iaIdentity: protectedProcedure.query(async ({ ctx }) => {
    return getIaIdentity(ctx.db);
  }),

  setIaIdentity: adminProcedure
    .input(z.object({
      name: z.string().trim().min(1).max(40),
      avatar: z.string().url().nullable(),
      persona: z.string().trim().max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const pairs: [string, string][] = [
        [IA_KEYS.name, input.name],
        [IA_KEYS.avatar, input.avatar ?? ""],
        [IA_KEYS.persona, input.persona || IA_DEFAULTS.persona],
      ];
      for (const [key, value] of pairs) {
        await ctx.db.appConfig.upsert({ where: { key }, create: { key, value }, update: { value } });
      }
      return { ok: true };
    }),

  suiteStatus: adminProcedure.query(async ({ ctx }) => {
    const row = await ctx.db.appConfig.findUnique({ where: { key: SUITE_COOKIE_KEY } });
    return { connected: !!row?.value, updatedAt: row?.updatedAt ?? null };
  }),

  setSuiteCookie: adminProcedure
    .input(z.object({ value: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.appConfig.upsert({
        where:  { key: SUITE_COOKIE_KEY },
        create: { key: SUITE_COOKIE_KEY, value: input.value.trim() },
        update: { value: input.value.trim() },
      });
      return { connected: true };
    }),

  clearSuiteCookie: adminProcedure.mutation(async ({ ctx }) => {
    await ctx.db.appConfig.deleteMany({ where: { key: SUITE_COOKIE_KEY } });
    return { connected: false };
  }),
});
