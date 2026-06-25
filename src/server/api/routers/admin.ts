import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

type Ctx = { session?: { user?: { role?: string } } | null };
function requireAdmin(ctx: Ctx) {
  if (ctx.session?.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin" });
  }
}

export const adminRouter = createTRPCRouter({
  users: publicProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);
    return ctx.db.user.findMany({
      where: { approved: true },
      select: { id: true, username: true, role: true },
      orderBy: { username: "asc" },
    });
  }),

  /** Asignar / desasignar una VCC a un usuario. */
  assignCard: publicProcedure
    .input(z.object({ vccId: z.string(), cardName: z.string().optional(), userId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      if (!input.userId) {
        await ctx.db.cardOwner.deleteMany({ where: { vccId: input.vccId } });
        return { ownerUserId: null };
      }
      await ctx.db.cardOwner.upsert({
        where:  { vccId: input.vccId },
        create: { vccId: input.vccId, userId: input.userId, cardName: input.cardName },
        update: { userId: input.userId, cardName: input.cardName },
      });
      return { ownerUserId: input.userId };
    }),

  /** Asignar / desasignar una campaña (su slug = subid) a un usuario. */
  assignCampaign: publicProcedure
    .input(z.object({ campaignId: z.string(), ownerId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      await ctx.db.campaign.update({
        where: { id: input.campaignId },
        data:  { ownerId: input.ownerId },
      });
      return { ownerId: input.ownerId };
    }),
});
