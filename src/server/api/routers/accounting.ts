import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { suiteFetch } from "@/lib/suite";

type DB = typeof import("@/server/db").db;

/** Revenue, costo VCC y costo suite por usuario. La base del reparto = revenue − VCC. */
async function computeFinances(db: DB) {
  const [users, campaigns, convs, cardOwners, spendAgg] = await Promise.all([
    db.user.findMany({ where: { approved: true }, select: { id: true, username: true } }),
    db.campaign.findMany({ select: { slug: true, ownerId: true } }),
    db.conversion.groupBy({ by: ["s1"], _sum: { price: true } }),
    db.cardOwner.findMany({ select: { vccId: true, userId: true } }),
    db.spendLog.groupBy({ by: ["userId"], _sum: { amount: true } }),
  ]);

  const nameById = new Map(users.map((u) => [u.id, u.username]));

  const ownerBySlug = new Map(campaigns.map((c) => [c.slug, c.ownerId]));
  const revenueByUser = new Map<string, number>();
  for (const row of convs) {
    const owner = row.s1 ? ownerBySlug.get(row.s1) : null;
    if (owner) revenueByUser.set(owner, (revenueByUser.get(owner) ?? 0) + (row._sum.price ?? 0));
  }

  const ownerByVcc = new Map(cardOwners.map((o) => [o.vccId, o.userId]));
  const vccCostByUser = new Map<string, number>();
  const { ok, data } = await suiteFetch("vcc");
  if (ok) {
    const all = ((data.vccs as { id: string; currentSpend?: number }[]) ?? []);
    for (const c of all) {
      const uid = ownerByVcc.get(c.id);
      if (uid) vccCostByUser.set(uid, (vccCostByUser.get(uid) ?? 0) + (c.currentSpend ?? 0));
    }
  }

  const suiteCostByUser = new Map(spendAgg.map((s) => [s.userId, s._sum.amount ?? 0]));
  return { users, nameById, revenueByUser, vccCostByUser, suiteCostByUser };
}

export const accountingRouter = createTRPCRouter({
  /** Registrar un gasto atribuido al usuario logueado. */
  logSpend: protectedProcedure
    .input(z.object({ kind: z.string(), amount: z.number().min(0), ref: z.string().optional(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session?.user?.id;
      if (!me) throw new TRPCError({ code: "UNAUTHORIZED" });
      if (input.amount <= 0) return { logged: false };
      await ctx.db.spendLog.create({ data: { userId: me, kind: input.kind, amount: input.amount, ref: input.ref, note: input.note } });
      return { logged: true };
    }),

  /** Resumen por usuario. base de reparto = revenue − VCC (suite va aparte como costo).
   *  Admin ve todos; un usuario solo su propia fila. */
  summary: protectedProcedure.query(async ({ ctx }) => {
    const isAdmin = ctx.session?.user?.role === "admin";
    const me = ctx.session?.user?.id ?? "";

    const { users, nameById, revenueByUser, vccCostByUser, suiteCostByUser } = await computeFinances(ctx.db);
    const splits = await ctx.db.revenueSplit.findMany();

    const splitsBySource = new Map<string, { beneficiaryUserId: string; percent: number }[]>();
    for (const s of splits) {
      const arr = splitsBySource.get(s.sourceUserId) ?? [];
      arr.push({ beneficiaryUserId: s.beneficiaryUserId, percent: s.percent });
      splitsBySource.set(s.sourceUserId, arr);
    }

    const rows = users.map((u) => {
      const revenue   = revenueByUser.get(u.id) ?? 0;
      const vccCost   = vccCostByUser.get(u.id) ?? 0;
      const suiteCost = suiteCostByUser.get(u.id) ?? 0;
      const splitBase = revenue - vccCost;        // ← lo que se reparte
      const profit    = splitBase - suiteCost;    // neto real (informativo)
      const splitRows = (splitsBySource.get(u.id) ?? []).map((r) => ({
        beneficiaryUserId: r.beneficiaryUserId,
        beneficiaryName:   nameById.get(r.beneficiaryUserId) ?? r.beneficiaryUserId,
        percent:           r.percent,
        amount:            (splitBase * r.percent) / 100,
      }));
      return { userId: u.id, username: u.username, revenue, vccCost, suiteCost, splitBase, profit, splits: splitRows };
    });

    return isAdmin ? rows : rows.filter((r) => r.userId === me);
  }),

  /** Comisiones del estrategista logueado: usuarios donde él tiene un % (su gente a cargo). */
  myCommissions: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.session.user.id;
    const splits = await ctx.db.revenueSplit.findMany({
      where: { beneficiaryUserId: me, NOT: { sourceUserId: me } },
    });
    if (!splits.length) return [];
    const { nameById, revenueByUser, vccCostByUser } = await computeFinances(ctx.db);
    return splits
      .map((s) => {
        const base = (revenueByUser.get(s.sourceUserId) ?? 0) - (vccCostByUser.get(s.sourceUserId) ?? 0);
        return {
          sourceUserId: s.sourceUserId,
          sourceName:   nameById.get(s.sourceUserId) ?? s.sourceUserId,
          percent:      s.percent,
          base,
          amount:       (base * s.percent) / 100,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }),

  /** (admin) Definir el reparto de un usuario fuente. Debe sumar 100%. */
  setSplit: adminProcedure
    .input(z.object({
      sourceUserId: z.string(),
      rows: z.array(z.object({ beneficiaryUserId: z.string(), percent: z.number().min(0).max(100) })),
    }))
    .mutation(async ({ ctx, input }) => {
      const valid = input.rows.filter((r) => r.percent > 0);
      const sum = valid.reduce((s, r) => s + r.percent, 0);
      if (valid.length && Math.abs(sum - 100) > 0.5) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `El reparto debe sumar 100% (suma ${sum}%).` });
      }
      await ctx.db.revenueSplit.deleteMany({ where: { sourceUserId: input.sourceUserId } });
      if (valid.length) {
        await ctx.db.revenueSplit.createMany({
          data: valid.map((r) => ({ sourceUserId: input.sourceUserId, beneficiaryUserId: r.beneficiaryUserId, percent: r.percent })),
        });
      }
      return { ok: true };
    }),
});
