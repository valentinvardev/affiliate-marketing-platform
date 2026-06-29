import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";

export const conversionsRouter = createTRPCRouter({
  /** Campañas destino para reasignar (todas, con su dueño). */
  targets: adminProcedure.query(async ({ ctx }) => {
    const camps = await ctx.db.campaign.findMany({
      select: { id: true, name: true, slug: true, owner: { select: { username: true } } },
      orderBy: { name: "asc" },
    });
    return camps.map((c) => ({ id: c.id, name: c.name, slug: c.slug, owner: c.owner?.username ?? null }));
  }),

  /** Reasigna una conversión a otro s1 (= slug de campaña). */
  reassign: adminProcedure
    .input(z.object({ conversionId: z.string(), s1: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.db.conversion.update({
        where: { id: input.conversionId },
        data: { s1: input.s1.trim() },
        select: { id: true, s1: true },
      }),
    ),
});
