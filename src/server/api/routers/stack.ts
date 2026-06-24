import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const itemInput = z.object({
  name:     z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
  tag:      z.string().default("1 hr"),
  badge:    z.string().default("TOP"),
  amount:   z.number().min(0),
  position: z.number().int().default(0),
});

export const stackRouter = createTRPCRouter({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db.appStack.findMany({
      orderBy: { createdAt: "asc" },
      include: { items: { orderBy: { position: "asc" } } },
    }),
  ),

  create: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.db.appStack.create({ data: input, include: { items: true } }),
    ),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.appStack.delete({ where: { id: input.id } }),
    ),

  addItem: publicProcedure
    .input(z.object({ stackId: z.string() }).merge(itemInput))
    .mutation(({ ctx, input }) =>
      ctx.db.appStackItem.create({ data: input }),
    ),

  updateItem: publicProcedure
    .input(z.object({ id: z.string() }).merge(itemInput.partial()))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.appStackItem.update({ where: { id }, data });
    }),

  removeItem: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.appStackItem.delete({ where: { id: input.id } }),
    ),

  applyToCampaign: publicProcedure
    .input(z.object({ stackId: z.string(), campaignId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const stack = await ctx.db.appStack.findUniqueOrThrow({
        where: { id: input.stackId },
        include: { items: { orderBy: { position: "asc" } } },
      });
      await ctx.db.campaignOffer.deleteMany({ where: { campaignId: input.campaignId } });
      if (stack.items.length > 0) {
        await ctx.db.campaignOffer.createMany({
          data: stack.items.map((item, idx) => ({
            campaignId: input.campaignId,
            name:       item.name,
            imageUrl:   item.imageUrl,
            tag:        item.tag,
            badge:      item.badge,
            amount:     item.amount,
            position:   idx,
          })),
        });
      }
      return { applied: stack.items.length };
    }),

  linkToOffer: publicProcedure
    .input(z.object({
      offerId:    z.string(),
      offerName:  z.string(),
      appStackId: z.string().nullable(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.offerConfig.upsert({
        where:  { offerId: input.offerId },
        create: { offerId: input.offerId, offerName: input.offerName, appStackId: input.appStackId },
        update: { appStackId: input.appStackId },
      }),
    ),
});
