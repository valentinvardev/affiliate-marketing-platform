import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { supabaseAdmin, TUTORIALS_BUCKET } from "@/lib/supabase";

/** Extensiones aceptadas: video (las que reproduce <video> sin transcodificar) + poster. */
const UPLOAD_EXT: Record<string, { ext: string; dir: string }> = {
  "video/mp4": { ext: "mp4", dir: "videos" },
  "video/webm": { ext: "webm", dir: "videos" },
  "video/quicktime": { ext: "mov", dir: "videos" }, // Safari/iPhone, si el códec es H.264
  "image/jpeg": { ext: "jpg", dir: "posters" }, // miniatura generada del propio video
};

const chapterInput = z.object({
  timeSec: z.number().int().min(0).max(60 * 60 * 12),
  title: z.string().min(1).max(120),
});

export const tutorialRouter = createTRPCRouter({
  /* ── Lectura (cualquier usuario logueado) ── */

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.tutorial.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      include: {
        chapters: { orderBy: { timeSec: "asc" } },
        _count: { select: { comments: true } },
      },
    });
  }),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tutorial.findUniqueOrThrow({
        where: { id: input.id },
        include: { chapters: { orderBy: { timeSec: "asc" } } },
      });
    }),

  /* ── Comentarios ── */

  comments: protectedProcedure
    .input(z.object({ tutorialId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.tutorialComment.findMany({
        where: { tutorialId: input.tutorialId },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, username: true, role: true } } },
      });
      return rows.map((c) => ({
        id: c.id,
        body: c.body,
        createdAt: c.createdAt,
        author: c.user.username,
        authorRole: c.user.role,
        mine: c.userId === ctx.session.user.id,
      }));
    }),

  addComment: protectedProcedure
    .input(z.object({ tutorialId: z.string(), body: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tutorialComment.create({
        data: {
          tutorialId: input.tutorialId,
          userId: ctx.session.user.id,
          body: input.body,
        },
      });
    }),

  /** Borra un comentario: el autor puede borrar el suyo; el admin, cualquiera. */
  deleteComment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const c = await ctx.db.tutorialComment.findUniqueOrThrow({ where: { id: input.id } });
      if (ctx.session.user.role !== "admin" && c.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No es tu comentario" });
      }
      return ctx.db.tutorialComment.delete({ where: { id: input.id } });
    }),

  /* ── Admin ── */

  /**
   * Tamaño máximo por archivo que acepta el storage. Sale de la config real del
   * bucket (o del proyecto si el bucket no tiene una propia), no de un número
   * hardcodeado: así la UI puede avisar antes de subir y no después del 400.
   */
  uploadLimits: adminProcedure.query(async () => {
    try {
      await supabaseAdmin.storage.createBucket(TUTORIALS_BUCKET, { public: true });
    } catch { /* ya existe */ }
    const { data } = await supabaseAdmin.storage.getBucket(TUTORIALS_BUCKET);
    return { maxBytes: data?.file_size_limit ?? null };
  }),

  /**
   * URL firmada para subir el video DIRECTO del navegador a Supabase Storage.
   * El archivo no pasa por el server: un video de cientos de MB reventaría el
   * límite de body de nginx y la RAM del VPS.
   */
  createUploadUrl: adminProcedure
    .input(z.object({
      filename: z.string().min(1).max(200),
      contentType: z.string().min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      const kind = UPLOAD_EXT[input.contentType];
      if (!kind) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Formato no soportado. Usá MP4, WEBM o MOV.",
        });
      }

      try {
        await supabaseAdmin.storage.createBucket(TUTORIALS_BUCKET, { public: true });
      } catch { /* ya existe */ }

      const path = `${kind.dir}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${kind.ext}`;
      const { data, error } = await supabaseAdmin.storage
        .from(TUTORIALS_BUCKET)
        .createSignedUploadUrl(path);

      if (error || !data) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error?.message ?? "No se pudo firmar la subida" });
      }

      const { data: pub } = supabaseAdmin.storage.from(TUTORIALS_BUCKET).getPublicUrl(path);
      return { signedUrl: data.signedUrl, token: data.token, path, publicUrl: pub.publicUrl };
    }),

  create: adminProcedure
    .input(z.object({
      title: z.string().trim().min(1).max(160),
      description: z.string().trim().max(2000).optional().nullable(),
      videoUrl: z.string().url(),
      posterUrl: z.string().url().optional().nullable(),
      durationSec: z.number().int().min(0).optional().nullable(),
      category: z.string().trim().max(60).optional().nullable(),
      chapters: z.array(chapterInput).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { chapters = [], ...rest } = input;
      const last = await ctx.db.tutorial.findFirst({ orderBy: { position: "desc" }, select: { position: true } });
      return ctx.db.tutorial.create({
        data: {
          ...rest,
          position: (last?.position ?? 0) + 1,
          chapters: { create: chapters },
        },
      });
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().trim().min(1).max(160).optional(),
      description: z.string().trim().max(2000).optional().nullable(),
      category: z.string().trim().max(60).optional().nullable(),
      posterUrl: z.string().url().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      return ctx.db.tutorial.update({ where: { id }, data: rest });
    }),

  /** Reemplaza el índice completo del video. */
  setChapters: adminProcedure
    .input(z.object({ tutorialId: z.string(), chapters: z.array(chapterInput).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.tutorialChapter.deleteMany({ where: { tutorialId: input.tutorialId } });
      if (input.chapters.length) {
        await ctx.db.tutorialChapter.createMany({
          data: input.chapters.map((c) => ({ ...c, tutorialId: input.tutorialId })),
        });
      }
      return { ok: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tut = await ctx.db.tutorial.findUniqueOrThrow({ where: { id: input.id } });
      // Borrar también el archivo del storage (best-effort).
      try {
        const marker = `/${TUTORIALS_BUCKET}/`;
        const i = tut.videoUrl.indexOf(marker);
        if (i !== -1) {
          const key = decodeURIComponent(tut.videoUrl.slice(i + marker.length));
          await supabaseAdmin.storage.from(TUTORIALS_BUCKET).remove([key]);
        }
      } catch { /* el registro se borra igual */ }
      return ctx.db.tutorial.delete({ where: { id: input.id } });
    }),

  /** Reordena la lista (el índice de la grilla). */
  reorder: adminProcedure
    .input(z.object({ ids: z.array(z.string()).max(200) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.$transaction(
        input.ids.map((id, i) =>
          ctx.db.tutorial.update({ where: { id }, data: { position: i } }),
        ),
      );
      return { ok: true };
    }),
});
