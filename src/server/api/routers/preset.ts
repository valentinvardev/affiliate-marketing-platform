import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const presetRouter = createTRPCRouter({
  colorList: publicProcedure.query(({ ctx }) =>
    ctx.db.colorPreset.findMany({ orderBy: { createdAt: "asc" } }),
  ),

  colorCreate: publicProcedure
    .input(z.object({ name: z.string().min(1), colorPrimary: z.string().min(1), colorBg: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.db.colorPreset.create({ data: input })),

  colorDelete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => ctx.db.colorPreset.delete({ where: { id: input.id } })),

  logoList: publicProcedure.query(({ ctx }) =>
    ctx.db.logoPreset.findMany({ orderBy: { createdAt: "asc" } }),
  ),

  logoCreate: publicProcedure
    .input(z.object({ name: z.string().min(1), imageUrl: z.string().url() }))
    .mutation(({ ctx, input }) => ctx.db.logoPreset.create({ data: input })),

  logoDelete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => ctx.db.logoPreset.delete({ where: { id: input.id } })),
});
