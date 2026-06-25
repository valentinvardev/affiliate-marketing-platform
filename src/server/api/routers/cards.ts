import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { suiteFetch } from "@/lib/suite";

type RawVcc = {
  id: string;
  cardName?: string;
  last4?: string;
  status?: string;
  [k: string]: unknown;
};

export const cardsRouter = createTRPCRouter({
  /** Lista scopeada: admin ve todas (active+closed); usuario solo sus active. */
  list: publicProcedure.query(async ({ ctx }) => {
    const isAdmin = ctx.session?.user?.role === "admin";
    const me = ctx.session?.user?.id ?? "";

    const { ok, status, data } = await suiteFetch("vcc");
    if (!ok) {
      const notConnected = status === 503 || status === 401 || status === 403;
      return { connected: !notConnected, cards: [] as (RawVcc & { ownerUserId: string | null })[] };
    }

    const all = ((data.vccs as RawVcc[]) ?? (data.cards as RawVcc[]) ?? []);
    const owners = await ctx.db.cardOwner.findMany();
    const ownerByVcc = new Map(owners.map((o) => [o.vccId, o.userId]));

    const withOwner = all.map((c) => ({ ...c, ownerUserId: ownerByVcc.get(c.id) ?? null }));

    const cards = isAdmin
      ? withOwner
      : withOwner.filter((c) => c.ownerUserId === me && c.status === "active");

    return { connected: true, cards };
  }),

  /** Crea una VCC en TapRain y la atribuye al usuario logueado. */
  create: publicProcedure
    .input(z.object({
      cardName:   z.string().min(1),
      spendLimit: z.number().min(0),
      bin:        z.string().optional(),
      campaignId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session?.user?.id;
      if (!me) throw new Error("No autenticado");

      const { ok, data } = await suiteFetch("vcc", { method: "POST", body: JSON.stringify(input) });
      if (!ok) throw new Error((data.message as string) ?? "No se pudo crear la tarjeta");

      const created = (data.vcc as RawVcc) ?? (data.card as RawVcc) ?? (data as RawVcc);
      const vccId = created?.id;
      if (vccId) {
        await ctx.db.cardOwner.create({
          data: { vccId, userId: me, cardName: input.cardName },
        }).catch(() => { /* ya mapeada */ });
      }
      return data;
    }),
});
