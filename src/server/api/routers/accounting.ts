import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { suiteFetch } from "@/lib/suite";

type Ctx = { session?: { user?: { id?: string; role?: string } } | null };
function requireAdmin(ctx: Ctx) {
  if (ctx.session?.user?.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Solo admin" });
}

export const accountingRouter = createTRPCRouter({
  /** Registrar un gasto atribuido al usuario logueado. */
  logSpend: adminProcedure
    .input(z.object({ kind: z.string(), amount: z.number().min(0), ref: z.string().optional(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session?.user?.id;
      if (!me) throw new TRPCError({ code: "UNAUTHORIZED" });
      if (input.amount <= 0) return { logged: false };
      await ctx.db.spendLog.create({ data: { userId: me, kind: input.kind, amount: input.amount, ref: input.ref, note: input.note } });
      return { logged: true };
    }),

  /** Resumen por usuario: revenue (sus campañas) − costos (VCC + suite) = profit, con reparto. */
  summary: adminProcedure.query(async ({ ctx }) => {
    const isAdmin = ctx.session?.user?.role === "admin";
    const me = ctx.session?.user?.id ?? "";

    const [users, campaigns, convs, cardOwners, spendAgg, splits] = await Promise.all([
      ctx.db.user.findMany({ where: { approved: true }, select: { id: true, username: true } }),
      ctx.db.campaign.findMany({ select: { slug: true, ownerId: true } }),
      ctx.db.conversion.groupBy({ by: ["s1"], _sum: { price: true } }),
      ctx.db.cardOwner.findMany({ select: { vccId: true, userId: true } }),
      ctx.db.spendLog.groupBy({ by: ["userId"], _sum: { amount: true } }),
      ctx.db.revenueSplit.findMany(),
    ]);

    const nameById = new Map(users.map((u) => [u.id, u.username]));

    // Revenue por usuario (conversion.s1 → campaign.slug → ownerId)
    const ownerBySlug = new Map(campaigns.map((c) => [c.slug, c.ownerId]));
    const revenueByUser = new Map<string, number>();
    for (const row of convs) {
      const owner = row.s1 ? ownerBySlug.get(row.s1) : null;
      if (owner) revenueByUser.set(owner, (revenueByUser.get(owner) ?? 0) + (row._sum.price ?? 0));
    }

    // Costo VCC (currentSpend live de TapRain, mapeado por CardOwner)
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

    // Costo suite/interacciones (SpendLog)
    const suiteCostByUser = new Map(spendAgg.map((s) => [s.userId, s._sum.amount ?? 0]));

    // Splits por usuario fuente
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
      const profit    = revenue - vccCost - suiteCost;
      const splitRows = (splitsBySource.get(u.id) ?? []).map((r) => ({
        beneficiaryUserId: r.beneficiaryUserId,
        beneficiaryName:   nameById.get(r.beneficiaryUserId) ?? r.beneficiaryUserId,
        percent:           r.percent,
        amount:            (profit * r.percent) / 100,
      }));
      return { userId: u.id, username: u.username, revenue, vccCost, suiteCost, profit, splits: splitRows };
    });

    return isAdmin ? rows : rows.filter((r) => r.userId === me);
  }),

  /** (admin) Definir el reparto de un usuario fuente: reemplaza sus filas. */
  setSplit: adminProcedure
    .input(z.object({
      sourceUserId: z.string(),
      rows: z.array(z.object({ beneficiaryUserId: z.string(), percent: z.number().min(0).max(100) })),
    }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx);
      await ctx.db.revenueSplit.deleteMany({ where: { sourceUserId: input.sourceUserId } });
      const valid = input.rows.filter((r) => r.percent > 0);
      if (valid.length) {
        await ctx.db.revenueSplit.createMany({
          data: valid.map((r) => ({ sourceUserId: input.sourceUserId, beneficiaryUserId: r.beneficiaryUserId, percent: r.percent })),
        });
      }
      return { ok: true };
    }),
});
