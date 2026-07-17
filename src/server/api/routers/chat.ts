import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { generateGlobalIaReply, mentionsIa, stripIa, IA_BOT_ID, IA_BOT_NAME } from "@/lib/global-ia";

export const chatRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.chatMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 50,
      });
      return rows.reverse(); // oldest → newest
    }),

  send: protectedProcedure
    .input(z.object({
      userId:   z.string().min(1),
      username: z.string().min(1).max(60),
      text:     z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const msg = await ctx.db.chatMessage.create({ data: input });

      // Comando /ia: la IA responde en el chat global (async, no bloquea el envío).
      if (input.userId !== IA_BOT_ID && mentionsIa(input.text)) {
        const db = ctx.db;
        const prompt = stripIa(input.text);
        void (async () => {
          const recent = (await db.chatMessage.findMany({ orderBy: { createdAt: "desc" }, take: 15 }))
            .reverse()
            .map((m) => ({ username: m.username, text: m.text }));
          const reply = await generateGlobalIaReply(db, { prompt, recent });
          if (reply) await db.chatMessage.create({ data: { userId: IA_BOT_ID, username: IA_BOT_NAME, text: reply } });
        })().catch(() => { /* best-effort */ });
      }

      return msg;
    }),
});
