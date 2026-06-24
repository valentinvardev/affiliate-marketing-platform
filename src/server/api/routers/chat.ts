import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const chatRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.chatMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 50,
      });
      return rows.reverse(); // oldest → newest
    }),

  send: publicProcedure
    .input(z.object({
      userId:   z.string().min(1),
      username: z.string().min(1).max(60),
      text:     z.string().min(1).max(2000),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.chatMessage.create({ data: input }),
    ),
});
