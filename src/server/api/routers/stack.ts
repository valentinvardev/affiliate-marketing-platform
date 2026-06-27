import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const itemInput = z.object({
  name:     z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
  tag:      z.string().default("1 hr"),
  badge:    z.string().default("TOP"),
  amount:   z.number().min(0),
  position: z.number().int().default(0),
});

export const stackRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db.appStack.findMany({
      orderBy: { createdAt: "asc" },
      include: { items: { orderBy: { position: "asc" } } },
    }),
  ),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(({ ctx, input }) =>
      ctx.db.appStack.create({ data: input, include: { items: true } }),
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.appStack.delete({ where: { id: input.id } }),
    ),

  addItem: protectedProcedure
    .input(z.object({ stackId: z.string() }).merge(itemInput))
    .mutation(({ ctx, input }) =>
      ctx.db.appStackItem.create({ data: input }),
    ),

  updateItem: protectedProcedure
    .input(z.object({ id: z.string() }).merge(itemInput.partial()))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.appStackItem.update({ where: { id }, data });
    }),

  removeItem: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.appStackItem.delete({ where: { id: input.id } }),
    ),

  applyToCampaign: protectedProcedure
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

  linkToOffer: protectedProcedure
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

  /** Setea el "paquete" de la oferta: color/logo/dominio + fuentes. */
  setOfferPackage: protectedProcedure
    .input(z.object({
      offerId:       z.string(),
      offerName:     z.string(),
      colorPresetId: z.string().nullable().optional(),
      logoPresetId:  z.string().nullable().optional(),
      domain:        z.string().nullable().optional(),
      fontTitle:     z.string().nullable().optional(),
      fontBody:      z.string().nullable().optional(),
      appIds:        z.array(z.string()).optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.offerConfig.upsert({
        where:  { offerId: input.offerId },
        create: {
          offerId: input.offerId, offerName: input.offerName,
          colorPresetId: input.colorPresetId ?? null,
          logoPresetId:  input.logoPresetId ?? null,
          domain:        input.domain ?? null,
          fontTitle:     input.fontTitle ?? null,
          fontBody:      input.fontBody ?? null,
          appIds:        input.appIds ?? [],
        },
        update: {
          ...(input.colorPresetId !== undefined ? { colorPresetId: input.colorPresetId } : {}),
          ...(input.logoPresetId  !== undefined ? { logoPresetId:  input.logoPresetId  } : {}),
          ...(input.domain        !== undefined ? { domain:        input.domain        } : {}),
          ...(input.fontTitle     !== undefined ? { fontTitle:     input.fontTitle     } : {}),
          ...(input.fontBody      !== undefined ? { fontBody:      input.fontBody      } : {}),
          ...(input.appIds        !== undefined ? { appIds:        input.appIds        } : {}),
        },
      }),
    ),

  /** Copia apps sueltas del directorio como las offers de una campaña. */
  applyAppsToCampaign: protectedProcedure
    .input(z.object({ campaignId: z.string(), appIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.campaignOffer.deleteMany({ where: { campaignId: input.campaignId } });
      if (!input.appIds.length) return { ok: true };
      const apps = await ctx.db.app.findMany({ where: { id: { in: input.appIds } } });
      // respeta el orden en que vienen los appIds
      const byId = new Map(apps.map((a) => [a.id, a]));
      const ordered = input.appIds.map((id) => byId.get(id)).filter(Boolean) as typeof apps;
      await ctx.db.campaignOffer.createMany({
        data: ordered.map((a, i) => ({
          campaignId: input.campaignId, name: a.name, imageUrl: a.imageUrl,
          tag: a.tag, badge: a.badge, amount: a.amount, position: i,
        })),
      });
      return { ok: true };
    }),
});
