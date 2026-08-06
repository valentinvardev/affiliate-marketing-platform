import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { generateGlobalIaReply, mentionsIa, stripIa, IA_BOT_ID } from "@/lib/global-ia";
import { getIaIdentity } from "@/lib/ia-identity";

/** El chat global es efímero: se conserva una semana. */
const RETENTION_DAYS = 7;

export const chatRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      // Poda al leer en vez de con un cron: la tabla tiene índice por createdAt
      // y el chat se abre seguido, así que sale barato y no hay job que mantener.
      const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000);
      await ctx.db.chatMessage
        .deleteMany({ where: { createdAt: { lt: cutoff } } })
        .catch(() => undefined);

      const rows = await ctx.db.chatMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: input?.limit ?? 50,
      });

      // Foto de perfil de cada autor. ChatMessage guarda userId como texto
      // suelto (sin relación), así que se resuelve en una consulta aparte.
      const ids = [...new Set(rows.map((r) => r.userId))].filter((id) => id !== IA_BOT_ID);
      const users = ids.length
        ? await ctx.db.user.findMany({ where: { id: { in: ids } }, select: { id: true, avatarUrl: true } })
        : [];
      const avatarById = new Map(users.map((u) => [u.id, u.avatarUrl]));
      const ia = await getIaIdentity(ctx.db);

      return rows.reverse().map((m) => ({
        ...m,
        // El nombre de la IA se resuelve al leer: si el admin lo cambia, los
        // mensajes viejos también aparecen con el nombre nuevo.
        username: m.userId === IA_BOT_ID ? ia.name : m.username,
        avatarUrl: m.userId === IA_BOT_ID ? ia.avatar : (avatarById.get(m.userId) ?? null),
      }));
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
          const ia = await getIaIdentity(db);
          const recent = (await db.chatMessage.findMany({ orderBy: { createdAt: "desc" }, take: 15 }))
            .reverse()
            .map((m) => ({ username: m.username, text: m.text }));
          const reply = await generateGlobalIaReply(db, { prompt, recent, identity: ia });
          if (reply) await db.chatMessage.create({ data: { userId: IA_BOT_ID, username: ia.name, text: reply } });
        })().catch(() => { /* best-effort */ });
      }

      return msg;
    }),
});
