import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

type Ctx = { session?: { user?: { role?: string } } | null };
function requireAdmin(ctx: Ctx) {
  if (ctx.session?.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin" });
  }
}

/** Normaliza a apex en minúsculas: saca esquema, path y www. */
function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  d = d.replace(/^www\./, "");
  return d;
}

export const domainsRouter = createTRPCRouter({
  /** Lista de dominios custom → campaña (admin). */
  list: publicProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);
    return ctx.db.landingDomain.findMany({
      orderBy: { domain: "asc" },
      include: {
        campaign: { select: { id: true, name: true, slug: true, colorPrimary: true, isActive: true } },
      },
    });
  }),

  /** Conecta (o reasigna) un dominio a una campaña. */
  add: publicProcedure
    .input(z.object({ domain: z.string().min(3), campaignId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const domain = normalizeDomain(input.domain);
      if (!domain.includes(".") || domain.includes(" ")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Dominio inválido" });
      }
      return ctx.db.landingDomain.upsert({
        where: { domain },
        create: { domain, campaignId: input.campaignId },
        update: { campaignId: input.campaignId },
      });
    }),

  /** Desconecta un dominio. */
  remove: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      await ctx.db.landingDomain.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
