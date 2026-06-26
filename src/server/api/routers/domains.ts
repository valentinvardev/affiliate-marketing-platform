import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure, protectedProcedure } from "@/server/api/trpc";

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
  list: adminProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);
    return ctx.db.landingDomain.findMany({
      orderBy: { domain: "asc" },
      include: {
        campaign: { select: { id: true, name: true, slug: true, colorPrimary: true, isActive: true } },
      },
    });
  }),

  /** Registra un dominio raíz (campaña "home" opcional). */
  add: adminProcedure
    .input(z.object({ domain: z.string().min(3), campaignId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      const domain = normalizeDomain(input.domain);
      if (!domain.includes(".") || domain.includes(" ")) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Dominio inválido" });
      }
      const campaignId = input.campaignId || null;
      return ctx.db.landingDomain.upsert({
        where: { domain },
        create: { domain, campaignId },
        update: { campaignId },
      });
    }),

  /** Lista de dominios registrados (para selects). No es dato sensible. */
  hosts: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.landingDomain.findMany({ orderBy: { domain: "asc" }, select: { domain: true } });
    return rows.map((r) => r.domain);
  }),

  /** Desconecta un dominio. */
  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      await ctx.db.landingDomain.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
