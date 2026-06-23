import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const offerInput = z.object({
  name:     z.string().min(1).max(120),
  imageUrl: z.string().url().optional().nullable(),
  tag:      z.string().min(1).max(40).default("1 hr"),
  badge:    z.string().min(1).max(20).default("TOP"),
  amount:   z.number().positive(),
  rating:   z.number().min(0).max(5).default(4.9),
  note:     z.string().max(200).optional().nullable(),
});

export const offerRouter = createTRPCRouter({
  listByCampaign: publicProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.campaignOffer.findMany({
        where: { campaignId: input.campaignId },
        orderBy: { position: "asc" },
      }),
    ),

  create: publicProcedure
    .input(z.object({ campaignId: z.string() }).merge(offerInput))
    .mutation(async ({ ctx, input }) => {
      const last = await ctx.db.campaignOffer.findFirst({
        where: { campaignId: input.campaignId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      return ctx.db.campaignOffer.create({
        data: { ...input, position: (last?.position ?? -1) + 1 },
      });
    }),

  update: publicProcedure
    .input(z.object({ id: z.string() }).merge(offerInput.partial()))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.campaignOffer.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.campaignOffer.delete({ where: { id: input.id } }),
    ),

  // Move offer up/down within the campaign
  reorder: publicProcedure
    .input(z.object({ id: z.string(), direction: z.enum(["up", "down"]) }))
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.db.campaignOffer.findUniqueOrThrow({
        where: { id: input.id },
      });

      const sibling = await ctx.db.campaignOffer.findFirst({
        where: {
          campaignId: offer.campaignId,
          position: input.direction === "up"
            ? { lt: offer.position }
            : { gt: offer.position },
        },
        orderBy: {
          position: input.direction === "up" ? "desc" : "asc",
        },
      });

      if (!sibling) return offer; // already at boundary

      // Swap positions
      await ctx.db.campaignOffer.update({
        where: { id: sibling.id },
        data: { position: offer.position },
      });
      return ctx.db.campaignOffer.update({
        where: { id: offer.id },
        data: { position: sibling.position },
      });
    }),
});
