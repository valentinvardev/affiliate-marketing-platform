import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { normalizeHost } from "@/server/redirect-resolver";

export const redirectsRouter = createTRPCRouter({
  list: adminProcedure.query(({ ctx }) => ctx.db.redirect.findMany({ orderBy: { createdAt: "asc" } })),

  create: adminProcedure
    .input(z.object({ domain: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const domain = normalizeHost(input.domain);
      if (!domain) throw new TRPCError({ code: "BAD_REQUEST", message: "Dominio inválido" });
      const exists = await ctx.db.redirect.findUnique({ where: { domain } });
      if (exists) throw new TRPCError({ code: "BAD_REQUEST", message: "Ese dominio ya tiene una redirección" });
      return ctx.db.redirect.create({ data: { domain } });
    }),

  save: adminProcedure
    .input(z.object({
      id: z.string(),
      whitepages: z.array(z.string()),
      targetUrl: z.string().nullable(),
      campaignId: z.string().nullable(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.redirect.update({
        where: { id: input.id },
        data: {
          whitepages: input.whitepages.map((s) => s.trim()).filter(Boolean),
          targetUrl: input.targetUrl?.trim() || null,
          campaignId: input.campaignId,
        },
      }),
    ),

  setCloak: adminProcedure
    .input(z.object({ id: z.string(), cloakOn: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.db.redirect.update({ where: { id: input.id }, data: { cloakOn: input.cloakOn } }),
    ),

  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => ctx.db.redirect.delete({ where: { id: input.id } })),
});
