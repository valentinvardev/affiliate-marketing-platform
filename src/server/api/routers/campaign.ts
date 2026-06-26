import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { slugify } from "@/lib/utils";

type GuardCtx = { db: typeof import("@/server/db").db; session: { user: { id: string; role: string } } };

/** Admin puede todo; un usuario solo su propia campaña. */
async function assertCanEdit(ctx: GuardCtx, id: string) {
  const c = await ctx.db.campaign.findUnique({ where: { id }, select: { ownerId: true } });
  if (!c) throw new TRPCError({ code: "NOT_FOUND", message: "Campaña no encontrada" });
  if (ctx.session.user.role !== "admin" && c.ownerId !== ctx.session.user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No es tu campaña" });
  }
}

// Color CSS seguro: bloquea `< > ; { } @ : "` para que no se pueda romper el
// <style> de la landing (anti stored-XSS). Permite oklch/hsl/rgb/hex/color-mix.
const cssColor = z
  .string()
  .max(64)
  .regex(/^[a-zA-Z0-9()%.,\-/#\s]+$/, "Color inválido");

const campaignInput = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/i, "Slug inválido").optional(),
  templateSlug: z.string().max(60).default("gonza-gb-sn-fc"),
  locale: z.string().min(2).max(10),
  currencySymbol: z.string().min(1).max(5),
  currencyCode: z.string().min(3).max(4),
  ctaUrl: z.string().url(),
  logoUrl: z.string().url().optional().nullable(),
  colorPrimary: cssColor.default("oklch(0.74 0.19 55)"),
  colorBg: cssColor.default("oklch(0.16 0.04 265)"),
  isActive: z.boolean().default(true),
  domain: z.string().max(120).optional().nullable(),
  fontTitle: z.string().max(40).optional().nullable(),
  fontBody: z.string().max(40).optional().nullable(),
});

export const campaignRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        onlyActive: z.boolean().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const isAdmin = ctx.session?.user?.role === "admin";
      const me = ctx.session?.user?.id;
      return ctx.db.campaign.findMany({
        where: {
          // admin ve todas; usuario normal solo las propias
          ...(isAdmin ? {} : me ? { ownerId: me } : { ownerId: "__none__" }),
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

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const c = await ctx.db.campaign.findUniqueOrThrow({ where: { id: input.id } });
      if (ctx.session.user.role !== "admin" && c.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No es tu campaña" });
      }
      return c;
    }),

  bySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const c = await ctx.db.campaign.findUnique({ where: { slug: input.slug } });
      if (c && ctx.session.user.role !== "admin" && c.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No es tu campaña" });
      }
      return c;
    }),

  create: protectedProcedure
    .input(campaignInput)
    .mutation(async ({ ctx, input }) => {
      // Slug automático y único: si está tomado, agrega -2, -3, …
      const base = slugify(input.slug || input.name) || "campania";
      let slug = base;
      for (let i = 2; await ctx.db.campaign.findUnique({ where: { slug }, select: { id: true } }); i++) {
        slug = `${base}-${i}`;
      }
      return ctx.db.campaign.create({
        data: { ...input, slug, ownerId: ctx.session.user.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(campaignInput.partial()))
    .mutation(async ({ ctx, input }) => {
      await assertCanEdit(ctx, input.id);
      const { id, slug: rawSlug, ...rest } = input;
      // Si viene slug (= s1), lo normalizo y deduplico (excluyéndome a mí mismo).
      let slug: string | undefined;
      if (rawSlug) {
        const base = slugify(rawSlug) || "campania";
        slug = base;
        for (let i = 2; ; i++) {
          const exists = await ctx.db.campaign.findUnique({ where: { slug }, select: { id: true } });
          if (!exists || exists.id === id) break;
          slug = `${base}-${i}`;
        }
      }
      return ctx.db.campaign.update({ where: { id }, data: { ...rest, ...(slug ? { slug } : {}) } });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertCanEdit(ctx, input.id);
      return ctx.db.campaign.delete({ where: { id: input.id } });
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await assertCanEdit(ctx, input.id);
      return ctx.db.campaign.update({
        where: { id: input.id },
        data: { isActive: input.isActive },
      });
    }),
});
