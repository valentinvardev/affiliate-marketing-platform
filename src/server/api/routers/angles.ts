import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { generateAngles, consolidateKb } from "@/lib/gemini";
import { OP_LABEL } from "@/lib/target-countries";

export const anglesRouter = createTRPCRouter({
  /* ── Generación (Agente 1) ── */
  generate: adminProcedure
    .input(z.object({ country: z.string().min(1), campaignId: z.string().optional(), guidance: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const kbRows = await ctx.db.angleKbEntry.findMany({ where: { country: input.country }, orderBy: { createdAt: "desc" }, take: 20 });
      const kb = kbRows.map((k) => k.entry);

      let metrics: string | undefined;
      if (input.campaignId) {
        const c = await ctx.db.campaign.findUnique({ where: { id: input.campaignId }, select: { slug: true, name: true } });
        if (c) {
          const [convs, clicks] = await Promise.all([
            ctx.db.conversion.findMany({ where: { s1: c.slug }, select: { price: true } }),
            ctx.db.click.count({ where: { s1: c.slug } }),
          ]);
          const revenue = convs.reduce((s, x) => s + x.price, 0);
          const cvr = clicks ? (convs.length / clicks) * 100 : 0;
          const epc = clicks ? revenue / clicks : 0;
          metrics = `Campaña "${c.name}": ${convs.length} conversiones, ${clicks} clicks, CVR ${cvr.toFixed(1)}%, EPC $${epc.toFixed(2)}, revenue $${revenue.toFixed(0)}.`;
        }
      }

      const result = await generateAngles({ country: input.country, operableHours: OP_LABEL, kb, metrics, guidance: input.guidance });
      const saved = await ctx.db.adAngle.create({
        data: { country: input.country, market: result.market_analysis, angles: result.angles, campaignId: input.campaignId ?? null, createdById: ctx.session.user.id },
      });
      return { id: saved.id, country: saved.country, campaignId: saved.campaignId, createdAt: saved.createdAt, ...result };
    }),

  list: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.adAngle.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return rows.map((r) => ({ id: r.id, country: r.country, campaignId: r.campaignId, createdAt: r.createdAt, market: r.market, angles: r.angles }));
  }),

  remove: adminProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => ctx.db.adAngle.delete({ where: { id: input.id } })),

  get: adminProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const r = await ctx.db.adAngle.findUnique({ where: { id: input.id } });
    if (!r) throw new TRPCError({ code: "NOT_FOUND", message: "Ángulo no encontrado." });
    return { id: r.id, country: r.country, market: r.market, angles: r.angles };
  }),

  /* ── Base de conocimientos ── */
  kbList: adminProcedure
    .input(z.object({ country: z.string().optional() }).optional())
    .query(({ ctx, input }) => ctx.db.angleKbEntry.findMany({ where: input?.country ? { country: input.country } : {}, orderBy: { createdAt: "desc" } })),
  kbAdd: adminProcedure
    .input(z.object({ country: z.string().min(1), entry: z.string().min(1), tags: z.array(z.string()).optional() }))
    .mutation(({ ctx, input }) => ctx.db.angleKbEntry.create({ data: { country: input.country, entry: input.entry.trim(), tags: (input.tags ?? []).map((t) => t.trim()).filter(Boolean), createdById: ctx.session.user.id } })),
  kbRemove: adminProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => ctx.db.angleKbEntry.delete({ where: { id: input.id } })),

  /* ── Feedback de un ángulo → aprendizaje automático (Agente 3) ── */
  feedback: adminProcedure
    .input(z.object({
      angleId: z.string(),
      angleName: z.string().min(1),
      outcome: z.enum(["worked", "failed"]),
      note: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const angle = await ctx.db.adAngle.findUnique({ where: { id: input.angleId }, select: { country: true, campaignId: true } });
      if (!angle) throw new TRPCError({ code: "NOT_FOUND", message: "Ángulo no encontrado." });

      let metrics: string | undefined;
      if (angle.campaignId) {
        const c = await ctx.db.campaign.findUnique({ where: { id: angle.campaignId }, select: { slug: true, name: true } });
        if (c) {
          const [convs, clicks] = await Promise.all([
            ctx.db.conversion.findMany({ where: { s1: c.slug }, select: { price: true } }),
            ctx.db.click.count({ where: { s1: c.slug } }),
          ]);
          const revenue = convs.reduce((s, x) => s + x.price, 0);
          const cvr = clicks ? (convs.length / clicks) * 100 : 0;
          metrics = `${convs.length} conversiones, ${clicks} clicks, CVR ${cvr.toFixed(1)}%, revenue $${revenue.toFixed(0)}`;
        }
      }

      const kb = await consolidateKb({
        country: angle.country,
        angleName: input.angleName,
        outcome: input.outcome === "worked" ? "Convirtió / funcionó bien" : "No convirtió / bajo rendimiento",
        note: input.note,
        metrics,
      });
      if (!kb.kb_entry) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Gemini no devolvió un aprendizaje." });

      return ctx.db.angleKbEntry.create({
        data: { country: angle.country, entry: kb.kb_entry, tags: kb.tags, createdById: ctx.session.user.id },
      });
    }),

  /* ── Librería de imágenes fuente (proof | hook) que sube el admin ── */
  proofList: adminProcedure
    .input(z.object({ country: z.string().optional(), kind: z.enum(["proof", "hook"]).optional() }).optional())
    .query(({ ctx, input }) => ctx.db.proofImage.findMany({
      where: { ...(input?.country ? { country: input.country } : {}), ...(input?.kind ? { kind: input.kind } : {}) },
      orderBy: { createdAt: "desc" },
    })),
  proofAdd: adminProcedure
    .input(z.object({ country: z.string().min(1), url: z.string().min(1), kind: z.enum(["proof", "hook"]).default("proof"), label: z.string().optional() }))
    .mutation(({ ctx, input }) => ctx.db.proofImage.create({ data: { country: input.country, kind: input.kind, url: input.url, label: input.label?.trim() || null, createdById: ctx.session.user.id } })),
  proofRemove: adminProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => ctx.db.proofImage.delete({ where: { id: input.id } })),

  /* ── Creativos exportados embebidos al ángulo ── */
  mediaList: adminProcedure
    .input(z.object({ angleId: z.string() }))
    .query(({ ctx, input }) => ctx.db.angleMedia.findMany({ where: { angleId: input.angleId }, orderBy: { createdAt: "desc" } })),
  mediaAdd: adminProcedure
    .input(z.object({ angleId: z.string(), url: z.string().min(1), slot: z.enum(["hook", "proof"]).default("hook") }))
    .mutation(({ ctx, input }) => ctx.db.angleMedia.create({ data: { angleId: input.angleId, url: input.url, slot: input.slot, createdById: ctx.session.user.id } })),
  mediaRemove: adminProcedure.input(z.object({ id: z.string() })).mutation(({ ctx, input }) => ctx.db.angleMedia.delete({ where: { id: input.id } })),
});
