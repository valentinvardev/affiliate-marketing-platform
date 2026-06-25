import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const presetRouter = createTRPCRouter({
  colorList: protectedProcedure.query(({ ctx }) =>
    ctx.db.colorPreset.findMany({ orderBy: { createdAt: "asc" } }),
  ),

  colorCreate: protectedProcedure
    .input(z.object({ name: z.string().min(1), colorPrimary: z.string().min(1), colorBg: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.db.colorPreset.create({ data: input })),

  colorDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => ctx.db.colorPreset.delete({ where: { id: input.id } })),

  logoList: protectedProcedure.query(({ ctx }) =>
    ctx.db.logoPreset.findMany({ orderBy: { createdAt: "asc" } }),
  ),

  logoCreate: protectedProcedure
    .input(z.object({ name: z.string().min(1), imageUrl: z.string().url() }))
    .mutation(({ ctx, input }) => ctx.db.logoPreset.create({ data: input })),

  logoDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => ctx.db.logoPreset.delete({ where: { id: input.id } })),
});
