import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const leaderboardRouter = createTRPCRouter({
  /** Ranking de usuarios por revenue de HOY (conversiones atribuidas por s1=slug). */
  ranking: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.session.user.id;
    const start = new Date(); start.setHours(0, 0, 0, 0);

    const [users, campaigns, convs] = await Promise.all([
      ctx.db.user.findMany({ where: { approved: true }, select: { id: true, username: true } }),
      ctx.db.campaign.findMany({ select: { slug: true, ownerId: true } }),
      ctx.db.conversion.findMany({ where: { receivedAt: { gte: start } }, select: { s1: true, price: true } }),
    ]);

    const bySlug = new Map<string, { rev: number; n: number }>();
    for (const c of convs) {
      if (!c.s1) continue;
      const cur = bySlug.get(c.s1) ?? { rev: 0, n: 0 };
      cur.rev += c.price; cur.n++;
      bySlug.set(c.s1, cur);
    }
    const slugsByOwner = new Map<string, string[]>();
    for (const cmp of campaigns) {
      if (!cmp.ownerId) continue;
      const arr = slugsByOwner.get(cmp.ownerId) ?? [];
      arr.push(cmp.slug);
      slugsByOwner.set(cmp.ownerId, arr);
    }

    const rows = users.map((u) => {
      let rev = 0, n = 0;
      for (const s of slugsByOwner.get(u.id) ?? []) { const r = bySlug.get(s); if (r) { rev += r.rev; n += r.n; } }
      return { userId: u.id, username: u.username, revenue: rev, conversions: n };
    }).sort((a, b) => b.revenue - a.revenue || b.conversions - a.conversions);

    const ranking = rows.map((r, i) => ({ ...r, rank: i + 1, isMe: r.userId === me }));
    return { ranking, myRank: ranking.find((r) => r.isMe)?.rank ?? null };
  }),
});
