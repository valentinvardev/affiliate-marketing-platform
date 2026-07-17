import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { chunkText, ingestChunks, clearSource } from "@/lib/rag";

/** Gestión de la base de conocimientos del asistente (RAG). Solo admin. */
export const knowledgeRouter = createTRPCRouter({
  // Fuentes cargadas con su cantidad de chunks.
  sources: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.$queryRawUnsafe<{ source: string; kind: string; count: number }[]>(
      `SELECT "source", "kind", count(*)::int AS count FROM "KnowledgeChunk" GROUP BY "source", "kind" ORDER BY count DESC`,
    );
    return rows;
  }),

  // Chunks de una fuente (sin el vector).
  chunks: adminProcedure
    .input(z.object({ source: z.string() }))
    .query(({ ctx, input }) => ctx.db.knowledgeChunk.findMany({
      where: { source: input.source },
      select: { id: true, content: true, kind: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    })),

  // Cargar texto libre (tu estrategia, FAQ, docs…): se chunkea, embebe y guarda.
  addText: adminProcedure
    .input(z.object({ source: z.string().min(1).max(40), text: z.string().min(1).max(200_000) }))
    .mutation(async ({ ctx, input }) => {
      const chunks = chunkText(input.text);
      if (!chunks.length) return { added: 0 };
      const added = await ingestChunks(ctx.db, { source: input.source.trim().toLowerCase(), kind: "manual", createdById: ctx.session.user.id, chunks });
      return { added };
    }),

  removeChunk: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => { await ctx.db.knowledgeChunk.deleteMany({ where: { id: input.id } }); return { ok: true }; }),

  removeSource: adminProcedure
    .input(z.object({ source: z.string() }))
    .mutation(async ({ ctx, input }) => { await clearSource(ctx.db, input.source); return { ok: true }; }),

  // Reindexar el conocimiento que ya vive en la DB (KB de ángulos + catálogo de apps).
  reindex: adminProcedure.mutation(async ({ ctx }) => {
    const me = ctx.session.user.id;

    const kb = await ctx.db.angleKbEntry.findMany({ select: { country: true, entry: true } });
    const kbTexts = kb.map((k) => `Aprendizaje de ángulos (${k.country}): ${k.entry}`);
    await clearSource(ctx.db, "angle-kb");
    const angleKb = await ingestChunks(ctx.db, { source: "angle-kb", kind: "auto", createdById: me, chunks: kbTexts });

    const apps = await ctx.db.app.findMany({ select: { name: true, amount: true, tag: true } });
    const appTexts = apps.map((a) => `App del catálogo: "${a.name}" paga $${a.amount}${a.tag ? ` (${a.tag})` : ""}.`);
    await clearSource(ctx.db, "apps");
    const appsN = await ingestChunks(ctx.db, { source: "apps", kind: "auto", createdById: me, chunks: appTexts });

    return { angleKb, apps: appsN };
  }),
});
