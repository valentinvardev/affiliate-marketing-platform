import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";

const SUITE_COOKIE_KEY = "taprain_suite_cookie";

export const configRouter = createTRPCRouter({
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
