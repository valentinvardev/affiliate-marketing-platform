import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { suiteFetch } from "@/lib/suite";
import { getLimits } from "@/lib/limits";

type RawVcc = {
  id: string;
  cardName?: string;
  last4?: string;
  status?: string;
  currentSpend?: number;
  spendLimit?: number;
  [k: string]: unknown;
};

export const cardsRouter = createTRPCRouter({
  /** Lista scopeada: admin ve todas (active+closed); usuario solo sus active. */
  list: protectedProcedure.query(async ({ ctx }) => {
    const isAdmin = ctx.session?.user?.role === "admin";
    const me = ctx.session?.user?.id ?? "";

    const { ok, status, data } = await suiteFetch("vcc");
    if (!ok) {
      const notConnected = status === 503 || status === 401 || status === 403;
      return { connected: !notConnected, cards: [] as (RawVcc & { ownerUserId: string | null })[] };
    }

    const all = ((data.vccs as RawVcc[]) ?? (data.cards as RawVcc[]) ?? []);
    const owners = await ctx.db.cardOwner.findMany();
    const ownerByVcc = new Map(owners.map((o) => [o.vccId, o]));

    // Resolver usernames (dueño + quién cerró)
    const ids = [...new Set(owners.flatMap((o) => [o.userId, o.closedById]).filter(Boolean) as string[])];
    const usersList = ids.length ? await ctx.db.user.findMany({ where: { id: { in: ids } }, select: { id: true, username: true } }) : [];
    const nameById = new Map(usersList.map((u) => [u.id, u.username]));

    const withOwner = all.map((c) => {
      const o = ownerByVcc.get(c.id);
      return {
        ...c,
        ownerUserId:      o?.userId ?? null,
        ownerUsername:    o ? nameById.get(o.userId) ?? null : null,
        campaignId:       o?.campaignId ?? null,
        closedAt:         o?.closedAt ?? null,
        closedByUsername: o?.closedById ? nameById.get(o.closedById) ?? null : null,
      };
    });

    const cards = isAdmin
      ? withOwner
      : withOwner.filter((c) => c.ownerUserId === me && c.status === "active" && !c.closedAt);

    return { connected: true, cards };
  }),

  /** Genera una VCC para una campaña, nombrada "{campaña} N" (N = siguiente). */
  createForCampaign: protectedProcedure
    .input(z.object({ campaignId: z.string(), spendLimit: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session.user.id;
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.campaignId },
        select: { name: true, ownerId: true },
      });
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND", message: "Campaña no encontrada" });

      const ownerId = campaign.ownerId ?? me;
      const { maxCards } = await getLimits(ctx.db);
      const activeCards = await ctx.db.cardOwner.count({ where: { userId: ownerId, closedAt: null } });
      if (activeCards >= maxCards) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Límite de ${maxCards} tarjetas activas por usuario alcanzado. Cerrá una para generar otra.` });
      }

      const n = await ctx.db.cardOwner.count({ where: { campaignId: input.campaignId } });
      const cardName = `${campaign.name} ${n + 1}`;

      const { ok, data } = await suiteFetch("vcc", {
        method: "POST",
        body: JSON.stringify({ cardName, spendLimit: input.spendLimit }),
      });
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: (data.message as string) ?? (data.error as string) ?? "No se pudo crear la VCC" });

      const created = (data.vcc as RawVcc) ?? (data.card as RawVcc) ?? (data as RawVcc);
      const vccId = created?.id;
      if (vccId) {
        await ctx.db.cardOwner.create({
          data: { vccId, userId: campaign.ownerId ?? me, cardName, campaignId: input.campaignId },
        }).catch(() => { /* ya mapeada */ });
      }
      return { ok: true, vccId: vccId ?? null, cardName };
    }),

  /** Crea una VCC en TapRain y la atribuye al usuario logueado. */
  create: protectedProcedure
    .input(z.object({
      cardName:   z.string().min(1),
      spendLimit: z.number().min(0),
      bin:        z.string().optional(),
      campaignId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session?.user?.id;
      if (!me) throw new Error("No autenticado");

      const { maxCards } = await getLimits(ctx.db);
      const activeCards = await ctx.db.cardOwner.count({ where: { userId: me, closedAt: null } });
      if (activeCards >= maxCards) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Límite de ${maxCards} tarjetas activas por usuario alcanzado. Cerrá una para generar otra.` });
      }

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

  /** Subir el límite de una tarjeta. */
  increaseLimit: protectedProcedure
    .input(z.object({ vccId: z.string(), spendLimit: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session?.user?.id;
      const isAdmin = ctx.session?.user?.role === "admin";
      const owner = await ctx.db.cardOwner.findUnique({ where: { vccId: input.vccId } });
      if (!isAdmin && owner?.userId !== me) throw new Error("No es tu tarjeta");
      const { ok, data } = await suiteFetch(`vcc/${input.vccId}/increase-limit`, {
        method: "POST", body: JSON.stringify({ newLimit: input.spendLimit }), // TapRain espera "newLimit"
      });
      if (!ok) throw new Error((data.message as string) ?? (data.error as string) ?? "No se pudo actualizar el límite");
      return data;
    }),

  /** Cerrar una tarjeta: pausa en TapRain + registra quién la cerró. */
  close: protectedProcedure
    .input(z.object({ vccId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session?.user?.id;
      if (!me) throw new Error("No autenticado");
      const isAdmin = ctx.session?.user?.role === "admin";
      const owner = await ctx.db.cardOwner.findUnique({ where: { vccId: input.vccId } });
      if (!owner || (owner.userId !== me && !isAdmin)) throw new Error("No es tu tarjeta");

      await ctx.db.cardOwner.update({
        where: { vccId: input.vccId },
        data:  { closedAt: new Date(), closedById: me },
      });
      // Pausar en TapRain (mejor acción disponible; no hay terminate)
      await suiteFetch(`vcc/${input.vccId}`, { method: "PATCH", body: JSON.stringify({ action: "pause" }) }).catch(() => { /* best-effort */ });
      return { closed: true };
    }),

  /** Vincular / desvincular una tarjeta a una campaña (para rastrear gasto del subid). */
  linkCampaign: protectedProcedure
    .input(z.object({ vccId: z.string(), campaignId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session?.user?.id;
      const isAdmin = ctx.session?.user?.role === "admin";
      const owner = await ctx.db.cardOwner.findUnique({ where: { vccId: input.vccId } });
      if (!owner || (owner.userId !== me && !isAdmin)) throw new Error("No es tu tarjeta");
      await ctx.db.cardOwner.update({ where: { vccId: input.vccId }, data: { campaignId: input.campaignId } });
      return { ok: true };
    }),

  /** Sincroniza el gasto de una tarjeta desde TapRain (scopeado al dueño). */
  syncSpend: protectedProcedure
    .input(z.object({ vccId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session?.user?.id;
      const isAdmin = ctx.session?.user?.role === "admin";
      const owner = await ctx.db.cardOwner.findUnique({ where: { vccId: input.vccId } });
      if (!isAdmin && owner?.userId !== me) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No es tu tarjeta" });
      }
      const { ok, data } = await suiteFetch(`vcc/${input.vccId}/sync-spend`, { method: "POST" });
      if (!ok) throw new TRPCError({ code: "BAD_REQUEST", message: (data.message as string) ?? "No se pudo sincronizar" });
      return data;
    }),
});
