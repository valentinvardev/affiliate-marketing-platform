import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { suiteFetch } from "@/lib/suite";
import { getLimits, todayKey, LIMIT_KEY_MAX_CARDS, LIMIT_KEY_DAILY_CAP } from "@/lib/limits";

type RawVcc = { id: string; status?: string; currentSpend?: number; [k: string]: unknown };

export const limitsRouter = createTRPCRouter({
  /** Límites configurados (admin). */
  config: adminProcedure.query(({ ctx }) => getLimits(ctx.db)),

  /** Edita los límites de VCC (admin). */
  setConfig: adminProcedure
    .input(z.object({
      maxCards: z.number().int().min(1).max(50),
      dailyCap: z.number().min(1).max(100000),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.appConfig.upsert({
        where: { key: LIMIT_KEY_MAX_CARDS },
        create: { key: LIMIT_KEY_MAX_CARDS, value: String(input.maxCards) },
        update: { value: String(input.maxCards) },
      });
      await ctx.db.appConfig.upsert({
        where: { key: LIMIT_KEY_DAILY_CAP },
        create: { key: LIMIT_KEY_DAILY_CAP, value: String(input.dailyCap) },
        update: { value: String(input.dailyCap) },
      });
      return { maxCards: input.maxCards, dailyCap: input.dailyCap };
    }),
  /**
   * Estado del límite de tarjetas del usuario logueado. Calcula el gasto del día
   * (total acumulado − baseline al inicio del día) y, si cruza el cap, pausa sus
   * VCCs activas (idempotente vía pausedAt). Lo consulta el topbar.
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.session.user.id;
    const { maxCards, dailyCap } = await getLimits(ctx.db);
    const out = {
      cardCount: 0, maxCards,
      spentToday: 0, dailyCap,
      reached: false, connected: true,
    };

    const owners = await ctx.db.cardOwner.findMany({ where: { userId: me } });
    const activeOwners = owners.filter((o) => !o.closedAt);
    out.cardCount = activeOwners.length;

    const { ok, data } = await suiteFetch("vcc");
    if (!ok) { out.connected = false; return out; }

    const all = (data.vccs as RawVcc[]) ?? (data.cards as RawVcc[]) ?? [];
    const myIds = new Set(activeOwners.map((o) => o.vccId));
    const myCards = all.filter((c) => myIds.has(c.id));
    const currentTotal = myCards.reduce((s, c) => s + (c.currentSpend ?? 0), 0);

    // Baseline diario (se resetea al cambiar de día; al resetear también limpia pausedAt).
    const day = todayKey();
    let guard = await ctx.db.spendGuard.findUnique({ where: { userId: me } });
    if (!guard || guard.day !== day) {
      guard = await ctx.db.spendGuard.upsert({
        where: { userId: me },
        create: { userId: me, day, baseline: currentTotal, pausedAt: null },
        update: { day, baseline: currentTotal, pausedAt: null },
      });
    }

    const spentToday = Math.max(0, currentTotal - guard.baseline);
    out.spentToday = spentToday;
    out.reached = spentToday >= dailyCap;

    // Auto-pausa al cruzar el cap (una sola vez por día).
    if (out.reached && !guard.pausedAt) {
      for (const c of myCards) {
        if (c.status === "active") {
          await suiteFetch(`vcc/${c.id}`, { method: "PATCH", body: JSON.stringify({ action: "pause" }) }).catch(() => { /* best-effort */ });
        }
      }
      await ctx.db.spendGuard.update({ where: { userId: me }, data: { pausedAt: new Date() } });
    }

    return out;
  }),
});
