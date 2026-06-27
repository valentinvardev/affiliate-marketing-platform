import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";

const appInput = z.object({
  name:     z.string().min(1).max(80),
  imageUrl: z.string().url().optional().nullable(),
  tag:      z.string().max(40).default("1 hr"),
  badge:    z.string().max(20).default("TOP"),
  amount:   z.number().min(0).default(0),
});

/** Directorio/librería de apps sueltas (se usan en ofertas sin stack). */
export const appsRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => ctx.db.app.findMany({ orderBy: { name: "asc" } })),

  create: adminProcedure
    .input(appInput)
    .mutation(({ ctx, input }) => ctx.db.app.create({ data: { ...input, imageUrl: input.imageUrl ?? null } })),

  update: adminProcedure
    .input(z.object({ id: z.string() }).merge(appInput.partial()))
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.app.update({ where: { id }, data });
    }),

  remove: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => ctx.db.app.delete({ where: { id: input.id } })),
});
