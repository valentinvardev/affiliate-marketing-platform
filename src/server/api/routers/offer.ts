import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

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
  /** Ofertas whitelisteadas con su "paquete" resuelto (color/logo/dominio/stack)
   *  para autocompletar al crear una campaña. */
  packages: protectedProcedure.query(async ({ ctx }) => {
    const configs = await ctx.db.offerConfig.findMany({
      where: { whitelisted: true },
      select: { offerId: true, offerName: true, imageUrl: true, appStackId: true, domain: true, colorPresetId: true, logoPresetId: true, fontTitle: true, fontBody: true, appIds: true },
      orderBy: { offerName: "asc" },
    });
    const colorIds = configs.map((c) => c.colorPresetId).filter(Boolean) as string[];
    const logoIds = configs.map((c) => c.logoPresetId).filter(Boolean) as string[];
    const allAppIds = [...new Set(configs.flatMap((c) => c.appIds))];
    const [colors, logos, apps] = await Promise.all([
      colorIds.length ? ctx.db.colorPreset.findMany({ where: { id: { in: colorIds } } }) : [],
      logoIds.length ? ctx.db.logoPreset.findMany({ where: { id: { in: logoIds } } }) : [],
      allAppIds.length ? ctx.db.app.findMany({ where: { id: { in: allAppIds } } }) : [],
    ]);
    const colorById = new Map(colors.map((c) => [c.id, c]));
    const logoById = new Map(logos.map((l) => [l.id, l]));
    const appById = new Map(apps.map((a) => [a.id, a]));
    return configs.map((c) => {
      const col = c.colorPresetId ? colorById.get(c.colorPresetId) : null;
      return {
        offerId:      c.offerId,
        offerName:    c.offerName,
        offerImage:   c.imageUrl,
        appStackId:   c.appStackId,
        domain:       c.domain,
        fontTitle:    c.fontTitle,
        fontBody:     c.fontBody,
        colorPrimary: col?.colorPrimary ?? null,
        colorBg:      col?.colorBg ?? null,
        logoUrl:      c.logoPresetId ? logoById.get(c.logoPresetId)?.imageUrl ?? null : null,
        appIds:       c.appIds,
        apps:         c.appIds.map((id) => appById.get(id)).filter(Boolean).map((a) => ({ name: a!.name, imageUrl: a!.imageUrl, badge: a!.badge, amount: a!.amount })),
      };
    });
  }),

  listByCampaign: protectedProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.campaignOffer.findMany({
        where: { campaignId: input.campaignId },
        orderBy: { position: "asc" },
      }),
    ),

  create: protectedProcedure
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

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(offerInput.partial()))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.campaignOffer.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.campaignOffer.delete({ where: { id: input.id } }),
    ),

  // Move offer up/down within the campaign
  reorder: protectedProcedure
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
