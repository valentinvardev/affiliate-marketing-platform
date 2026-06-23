import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { slugify } from "@/lib/utils";

const campaignInput = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).optional(),
  templateSlug: z.string().default("gonza-gb-sn-fc"),
  locale: z.string().min(2).max(10),
  currencySymbol: z.string().min(1).max(5),
  currencyCode: z.string().min(3).max(4),
  ctaUrl: z.string().url(),
  logoUrl: z.string().url().optional().nullable(),
  colorPrimary: z.string().default("oklch(0.74 0.19 55)"),
  colorBg: z.string().default("oklch(0.16 0.04 265)"),
  isActive: z.boolean().default(true),
});

export const campaignRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        onlyActive: z.boolean().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.campaign.findMany({
        where: {
          ...(input?.onlyActive ? { isActive: true } : {}),
          ...(input?.search
            ? {
                OR: [
                  { name: { contains: input.search, mode: "insensitive" } },
                  { slug: { contains: input.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.campaign.findUniqueOrThrow({ where: { id: input.id } });
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.campaign.findUnique({ where: { slug: input.slug } });
    }),

  create: publicProcedure
    .input(campaignInput)
    .mutation(async ({ ctx, input }) => {
      const slug = input.slug ?? slugify(input.name);
      return ctx.db.campaign.create({
        data: { ...input, slug },
      });
    }),

  update: publicProcedure
    .input(z.object({ id: z.string() }).merge(campaignInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, slug: rawSlug, name, ...rest } = input;
      const slug =
        rawSlug !== undefined
          ? rawSlug
          : name !== undefined
            ? slugify(name)
            : undefined;
      return ctx.db.campaign.update({
        where: { id },
        data: { ...(name ? { name } : {}), ...(slug ? { slug } : {}), ...rest },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.campaign.delete({ where: { id: input.id } });
    }),

  toggleActive: publicProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.campaign.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),
});
