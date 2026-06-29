import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { normalizeHost, normalizePath, DEFAULT_SAFE_PAGES } from "@/server/redirect-resolver";

export const redirectsRouter = createTRPCRouter({
  /* ── Dominios disponibles (sólo admin los administra) ── */
  domains: protectedProcedure.query(({ ctx }) => ctx.db.redirectDomain.findMany({ orderBy: { createdAt: "asc" } })),

  addDomain: adminProcedure
    .input(z.object({ domain: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const domain = normalizeHost(input.domain);
      if (!domain) throw new TRPCError({ code: "BAD_REQUEST", message: "Dominio inválido" });
      const exists = await ctx.db.redirectDomain.findUnique({ where: { domain } });
      if (exists) throw new TRPCError({ code: "BAD_REQUEST", message: "Ese dominio ya está" });
      return ctx.db.redirectDomain.create({ data: { domain } });
    }),

  removeDomain: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.db.redirectDomain.findUnique({ where: { id: input.id } });
      if (!d) return { ok: true };
      // borra el dominio y todos sus redirectores
      await ctx.db.redirect.deleteMany({ where: { domain: d.domain } });
      await ctx.db.redirectDomain.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  /* ── Redirectores (cada usuario ve los suyos; admin ve todos) ── */
  list: protectedProcedure.query(({ ctx }) => {
    const isAdmin = ctx.session.user.role === "admin";
    return ctx.db.redirect.findMany({
      where: isAdmin ? {} : { createdById: ctx.session.user.id },
      orderBy: [{ domain: "asc" }, { path: "asc" }],
    });
  }),

  create: protectedProcedure
    .input(z.object({ domain: z.string().min(1), path: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const domain = normalizeHost(input.domain);
      if (!domain) throw new TRPCError({ code: "BAD_REQUEST", message: "Dominio inválido" });
      const allowed = await ctx.db.redirectDomain.findUnique({ where: { domain } });
      if (!allowed) throw new TRPCError({ code: "BAD_REQUEST", message: "Ese dominio no está habilitado" });
      const path = normalizePath(input.path);
      const taken = await ctx.db.redirect.findUnique({ where: { domain_path: { domain, path } } });
      if (taken) throw new TRPCError({ code: "BAD_REQUEST", message: `${domain}/${path} ya está en uso` });
      return ctx.db.redirect.create({
        data: { domain, path, createdById: ctx.session.user.id, whitepages: DEFAULT_SAFE_PAGES },
      });
    }),

  save: protectedProcedure
    .input(z.object({
      id: z.string(),
      whitepages: z.array(z.string()),
      targetUrl: z.string().nullable(),
      campaignId: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(ctx, input.id);
      return ctx.db.redirect.update({
        where: { id: input.id },
        data: {
          whitepages: input.whitepages.map((s) => s.trim()).filter(Boolean),
          targetUrl: input.targetUrl?.trim() || null,
          campaignId: input.campaignId,
        },
      });
    }),

  setCloak: protectedProcedure
    .input(z.object({ id: z.string(), cloakOn: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(ctx, input.id);
      return ctx.db.redirect.update({ where: { id: input.id }, data: { cloakOn: input.cloakOn } });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwner(ctx, input.id);
      return ctx.db.redirect.delete({ where: { id: input.id } });
    }),
});

/** Sólo el dueño (o admin) puede tocar un redirector. */
async function assertOwner(
  ctx: { db: typeof import("@/server/db").db; session: { user: { id: string; role?: string | null } } },
  id: string,
) {
  const r = await ctx.db.redirect.findUnique({ where: { id }, select: { createdById: true } });
  if (!r) throw new TRPCError({ code: "NOT_FOUND", message: "No existe" });
  if (ctx.session.user.role !== "admin" && r.createdById !== ctx.session.user.id) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No es tu redirector" });
  }
}
