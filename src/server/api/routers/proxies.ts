import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/api/trpc";
import { getLimits, LIMIT_KEY_MAX_PROXIES } from "@/lib/limits";
import { fetchIproyalProxies } from "@/lib/iproyal";

type P = { host: string; httpPort: number; socksPort: number | null; username: string; password: string };
const httpStr = (p: P) => `http://${p.username}:${p.password}@${p.host}:${p.httpPort}`;
const socksStr = (p: P) => (p.socksPort ? `socks5://${p.username}:${p.password}@${p.host}:${p.socksPort}` : null);

export const proxiesRouter = createTRPCRouter({
  /* ── Usuario ── */
  mine: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.session.user.id;
    const [claims, availableCount, { maxProxies }] = await Promise.all([
      ctx.db.proxyClaim.findMany({ where: { userId: me }, include: { proxy: true }, orderBy: { claimedAt: "desc" } }),
      ctx.db.proxy.count({ where: { status: "available" } }),
      getLimits(ctx.db),
    ]);
    return {
      max: maxProxies,
      available: availableCount,
      items: claims.map((c) => ({
        id: c.proxy.id, host: c.proxy.host, httpPort: c.proxy.httpPort, socksPort: c.proxy.socksPort,
        username: c.proxy.username, password: c.proxy.password, label: c.proxy.label, country: c.proxy.country,
        expiresAt: c.proxy.expiresAt, claimedAt: c.claimedAt,
        http: httpStr(c.proxy), socks: socksStr(c.proxy),
      })),
    };
  }),

  claim: protectedProcedure.mutation(async ({ ctx }) => {
    const me = ctx.session.user.id;
    const { maxProxies } = await getLimits(ctx.db);
    const held = await ctx.db.proxyClaim.count({ where: { userId: me } });
    if (held >= maxProxies) throw new TRPCError({ code: "BAD_REQUEST", message: `Llegaste al límite de ${maxProxies} proxies.` });
    const p = await ctx.db.proxy.findFirst({ where: { status: "available" }, orderBy: { createdAt: "asc" } });
    if (!p) throw new TRPCError({ code: "BAD_REQUEST", message: "No hay proxies disponibles en el pool." });
    try {
      await ctx.db.$transaction([
        ctx.db.proxyClaim.create({ data: { proxyId: p.id, userId: me } }),
        ctx.db.proxy.update({ where: { id: p.id }, data: { status: "claimed" } }),
      ]);
    } catch {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Otro usuario lo tomó justo, probá de nuevo." });
    }
    return { ok: true };
  }),

  release: protectedProcedure
    .input(z.object({ proxyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const me = ctx.session.user.id;
      const claim = await ctx.db.proxyClaim.findUnique({ where: { proxyId: input.proxyId } });
      if (!claim || claim.userId !== me) throw new TRPCError({ code: "FORBIDDEN", message: "No es tu proxy" });
      await ctx.db.$transaction([
        ctx.db.proxyClaim.delete({ where: { proxyId: input.proxyId } }),
        ctx.db.proxy.update({ where: { id: input.proxyId }, data: { status: "available" } }),
      ]);
      return { ok: true };
    }),

  /* ── Admin ── */
  stats: adminProcedure.query(async ({ ctx }) => {
    const [available, claimed, disabled] = await Promise.all([
      ctx.db.proxy.count({ where: { status: "available" } }),
      ctx.db.proxy.count({ where: { status: "claimed" } }),
      ctx.db.proxy.count({ where: { status: "disabled" } }),
    ]);
    const tokenRow = await ctx.db.appConfig.findUnique({ where: { key: "iproyal_token" } });
    return { available, claimed, disabled, total: available + claimed + disabled, hasToken: !!tokenRow?.value || !!process.env.IPROYAL_API_TOKEN };
  }),

  setToken: adminProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.appConfig.upsert({
        where: { key: "iproyal_token" },
        create: { key: "iproyal_token", value: input.token.trim() },
        update: { value: input.token.trim() },
      });
      return { ok: true };
    }),

  setLimit: adminProcedure
    .input(z.object({ maxProxies: z.number().int().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.appConfig.upsert({
        where: { key: LIMIT_KEY_MAX_PROXIES },
        create: { key: LIMIT_KEY_MAX_PROXIES, value: String(input.maxProxies) },
        update: { value: String(input.maxProxies) },
      });
      return { ok: true };
    }),

  sync: adminProcedure.mutation(async ({ ctx }) => {
    const res = await fetchIproyalProxies();
    if (!res.ok) throw new TRPCError({ code: "BAD_REQUEST", message: res.error ?? "Error consultando IPRoyal" });
    let added = 0, updated = 0;
    for (const p of res.proxies) {
      const existing = await ctx.db.proxy.findUnique({ where: { externalId: p.externalId } });
      if (existing) {
        await ctx.db.proxy.update({
          where: { externalId: p.externalId },
          data: { host: p.host, httpPort: p.httpPort, socksPort: p.socksPort, username: p.username, password: p.password, label: p.label, country: p.country, orderId: p.orderId, expiresAt: p.expiresAt },
        });
        updated++;
      } else {
        await ctx.db.proxy.create({ data: p });
        added++;
      }
    }
    return { added, updated, total: res.proxies.length };
  }),
});
