import { z } from "zod";
import {
  GoogleGenerativeAI, SchemaType,
  type FunctionDeclaration, type Content, type Part,
} from "@google/generative-ai";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { retrieveContext } from "@/lib/rag";
import { fetchStats, type StatsRange } from "@/lib/taprain";

const MODEL = "gemini-2.5-flash";
const MAX_STEPS = 6;
const RANGES: StatsRange[] = ["hour", "today", "yesterday", "7days", "30days"];

// Misma ventana temporal que usa la página de Estadísticas.
function windowFor(range: StatsRange): { from: Date; to: Date } {
  const now = new Date();
  const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (range) {
    case "hour": return { from: new Date(now.getTime() - 3_600_000), to: now };
    case "today": return { from: sod, to: now };
    case "yesterday": return { from: new Date(sod.getTime() - 86_400_000), to: sod };
    case "7days": return { from: new Date(sod.getTime() - 7 * 86_400_000), to: now };
    case "30days": return { from: new Date(sod.getTime() - 30 * 86_400_000), to: now };
  }
}

// Tipo estructural del caller SOLO con lo que usamos. No referencia appRouter a
// propósito: hacerlo crea un ciclo de tipos que rompe la inferencia de todo `api`.
type Caller = {
  accounting: { summary: () => Promise<unknown> };
  campaign: { list: (input?: Record<string, unknown>) => Promise<unknown> };
  cards: {
    list: () => Promise<{ cards: { id: string; status: string; closedAt: unknown }[] }>;
    close: (input: { vccId: string }) => Promise<unknown>;
  };
  angles: {
    generate: (input: { country: string; guidance?: string }) => Promise<{ id: string; country: string; angles?: { angle_name: string }[] }>;
  };
};
type Ctx = { db: typeof import("@/server/db").db; session: { user: { id: string; role: string; name?: string | null } } };
type PendingAction = { type: "pause_vccs"; count: number };
type Ref = { kind: "angle"; id: string; label: string };

/* ── Declaración de herramientas (lo que el modelo puede pedir) ── */
const TOOLS: { decl: FunctionDeclaration; adminOnly?: boolean }[] = [
  { decl: { name: "get_finances", description: "Revenue, costo de VCC, costo de suite y profit (neto) del usuario. Un usuario normal ve solo lo suyo; un admin ve a todos. Todo el histórico.", parameters: { type: SchemaType.OBJECT, properties: {} } } },
  { decl: { name: "get_period_stats", description: "Métricas del período (revenue, conversiones, clicks, EPC), IGUAL que la página de Estadísticas. Para admin usa el resumen de TapRain (cuenta completa); para usuarios, sus campañas (datos locales). Usalo para 'cuánto facturé/cliquearon hoy/ayer/esta semana'.", parameters: { type: SchemaType.OBJECT, properties: { range: { type: SchemaType.STRING, description: "Uno de: hour, today, yesterday, 7days (semana), 30days (mes)." } }, required: ["range"] } } },
  { decl: { name: "get_stats_by_campaign", description: "Desglose por campaña (clicks, conversiones, revenue) y por país (solo conversiones — los clicks NO tienen país guardado). Para 'de qué campaña/ubicación vienen los clicks o las conversiones'. days=0 = histórico completo.", parameters: { type: SchemaType.OBJECT, properties: { days: { type: SchemaType.NUMBER, description: "Días hacia atrás; 0 = histórico." } } } } },
  { decl: { name: "list_campaigns", description: "Lista de campañas del usuario (admin: todas), con estado.", parameters: { type: SchemaType.OBJECT, properties: {} } } },
  { decl: { name: "get_vccs", description: "Estado de las tarjetas virtuales (VCCs) del usuario: activas, gasto, límites.", parameters: { type: SchemaType.OBJECT, properties: {} } } },
  { decl: { name: "search_knowledge", description: "Busca en la base de conocimientos de la plataforma (docs, estrategia, KB de ángulos, FAQ) por significado.", parameters: { type: SchemaType.OBJECT, properties: { query: { type: SchemaType.STRING, description: "Qué buscar." } }, required: ["query"] } } },
  { decl: { name: "pause_my_vccs", description: "Pausa TODAS las VCCs activas del usuario. NO se ejecuta sola: pide confirmación explícita del usuario.", parameters: { type: SchemaType.OBJECT, properties: {} } } },
  { decl: { name: "generate_angles", description: "(solo admin) Genera ángulos creativos de TikTok Ads para un país con Gemini.", parameters: { type: SchemaType.OBJECT, properties: { country: { type: SchemaType.STRING, description: "País objetivo (ej. Suecia)." }, guidance: { type: SchemaType.STRING, description: "Instrucciones opcionales para condicionar los ángulos." } }, required: ["country"] }, }, adminOnly: true },
];

function buildSystem(role: "admin" | "user", name: string | null | undefined, kb: string): string {
  return `Sos el asistente de TapSur, el "segundo cerebro" de ${name ?? "el usuario"} para media buying de TikTok Ads (nicho get-paid-to-play).
Rol del usuario: ${role === "admin" ? "ADMIN (acceso total a datos y acciones)" : "usuario normal (SOLO sus propios datos)"}.
Fecha de hoy: ${new Date().toISOString().slice(0, 10)}.

Reglas:
- Respondé en español, breve, concreto, con tono de colega experto. Sin rodeos ni relleno.
- Para CUALQUIER dato (gasto, profit, revenue, campañas, VCCs, clicks) usá las herramientas. Nunca inventes números.
- Un usuario normal solo puede ver SUS datos; las herramientas ya lo garantizan. No ofrezcas datos de otros usuarios.
- Para acciones (pausar VCCs) llamá la herramienta correspondiente, pero NUNCA des por hecha la acción: el usuario tiene que confirmarla con un botón. Explicá qué va a pasar y pedí confirmación.
- Si te preguntan cómo funciona algo de la plataforma o de estrategia, usá search_knowledge antes de responder.
- Si una herramienta devuelve un error de permisos, explicáselo al usuario con naturalidad.${kb ? `\n\nContexto recuperado de la base de conocimientos (usalo si es relevante, citá la fuente entre paréntesis si aplica):\n${kb}` : ""}`;
}

/* ── Ejecución de herramientas (scopeada por el caller/procedures) ── */
async function executeTool(name: string, args: Record<string, unknown>, ctx: Ctx, caller: Caller): Promise<{ data: unknown; pendingAction?: PendingAction; ref?: Ref }> {
  switch (name) {
    case "get_finances": {
      const rows = await caller.accounting.summary();
      return { data: rows };
    }
    case "get_period_stats": {
      const range: StatsRange = RANGES.includes(args.range as StatsRange) ? (args.range as StatsRange) : "7days";
      const isAdmin = ctx.session.user.role === "admin";
      // Admin: mismo origen que la página de Estadísticas → resumen de TapRain (cuenta completa).
      if (isAdmin) {
        try {
          const s = (await fetchStats(range)).summary;
          // TapRain a veces trae revenue/clicks pero no conversions → completamos con local (igual que Estadísticas).
          const { from, to } = windowFor(range);
          const [convs, clickRows] = await Promise.all([
            ctx.db.conversion.findMany({ where: { receivedAt: { gte: from, lte: to } }, select: { price: true } }),
            ctx.db.click.findMany({ where: { createdAt: { gte: from, lte: to } }, select: { ip: true }, distinct: ["ip"] }),
          ]);
          const localRevenue = convs.reduce((a, c) => a + c.price, 0);
          const revenue = s.revenue ?? localRevenue;
          const conversions = s.conversions ?? convs.length;
          const clicks = s.clicks ?? clickRows.length;
          const epc = s.epc ?? (clicks ? revenue / clicks : null);
          return { data: { range, source: "TapRain + local para lo que falte (igual que Estadísticas)", revenue, conversions, clicks, epc } };
        } catch { /* si TapRain falla, caemos a datos locales */ }
      }
      // Usuario (o fallback de admin): datos locales. Admin → global; usuario → sus campañas.
      const me = ctx.session.user.id;
      const slugs: string[] | null = isAdmin ? null : (await ctx.db.campaign.findMany({ where: { ownerId: me }, select: { slug: true } })).map((c) => c.slug).filter(Boolean) as string[];
      const scope = slugs === null ? {} : { s1: { in: slugs.length ? slugs : ["__no-match__"] } };
      const { from, to } = windowFor(range);
      const [convs, clickRows] = await Promise.all([
        ctx.db.conversion.findMany({ where: { ...scope, receivedAt: { gte: from, lte: to } }, select: { price: true } }),
        ctx.db.click.findMany({ where: { ...scope, createdAt: { gte: from, lte: to } }, select: { ip: true }, distinct: ["ip"] }),
      ]);
      const revenue = convs.reduce((s, x) => s + x.price, 0);
      const clicks = clickRows.length;
      return { data: { range, source: "local (tus campañas)", revenue, conversions: convs.length, clicks, clicks_note: "clicks = visitantes únicos por IP", epc: clicks ? revenue / clicks : 0 } };
    }
    case "get_stats_by_campaign": {
      const days = Math.max(0, Math.min(365, Number(args.days) || 0));
      const isAdmin = ctx.session.user.role === "admin";
      const me = ctx.session.user.id;
      const campaigns = await ctx.db.campaign.findMany({ where: isAdmin ? {} : { ownerId: me }, select: { name: true, slug: true } });
      const slugs = campaigns.map((c) => c.slug).filter(Boolean) as string[];
      const since = days > 0 ? new Date(Date.now() - days * 86400000) : null;
      const [convs, clickRows] = await Promise.all([
        ctx.db.conversion.findMany({ where: { s1: { in: slugs }, ...(since ? { receivedAt: { gte: since } } : {}) }, select: { s1: true, price: true, country: true } }),
        ctx.db.click.findMany({ where: { s1: { in: slugs }, ...(since ? { createdAt: { gte: since } } : {}) }, select: { s1: true, ip: true }, distinct: ["s1", "ip"] }),
      ]);
      const clicksBySlug = new Map<string, number>(); // clicks = visitantes únicos por IP
      for (const r of clickRows) clicksBySlug.set(r.s1, (clicksBySlug.get(r.s1) ?? 0) + 1);
      const byCampaign = campaigns.map((c) => {
        const cConvs = convs.filter((x) => x.s1 === c.slug);
        return { campaign: c.name, clicks: clicksBySlug.get(c.slug ?? "") ?? 0, conversions: cConvs.length, revenue: cConvs.reduce((s, x) => s + x.price, 0) };
      }).filter((r) => r.clicks || r.conversions);
      const countryMap = new Map<string, { conversions: number; revenue: number }>();
      for (const c of convs) {
        const k = c.country ?? "desconocido";
        const e = countryMap.get(k) ?? { conversions: 0, revenue: 0 };
        e.conversions++; e.revenue += c.price; countryMap.set(k, e);
      }
      const byCountry = [...countryMap.entries()].map(([country, v]) => ({ country, ...v })).sort((a, b) => b.conversions - a.conversions);
      return { data: { period: days > 0 ? `últimos ${days} días` : "histórico", byCampaign, byCountry } };
    }
    case "list_campaigns": {
      const list = await caller.campaign.list({});
      return { data: list };
    }
    case "get_vccs": {
      const res = await caller.cards.list();
      return { data: res };
    }
    case "search_knowledge": {
      const chunks = await retrieveContext(ctx.db, String(args.query ?? ""), 6).catch(() => []);
      return { data: chunks.length ? chunks : { note: "Sin resultados en la base de conocimientos." } };
    }
    case "pause_my_vccs": {
      const res = await caller.cards.list();
      const active = res.cards.filter((c) => c.status === "active" && !c.closedAt);
      return {
        data: { status: "needs_confirmation", count: active.length, note: "NO pauses nada todavía. Decile al usuario cuántas VCCs se van a pausar y pedí que confirme con el botón." },
        pendingAction: { type: "pause_vccs", count: active.length },
      };
    }
    case "generate_angles": {
      try {
        const r = await caller.angles.generate({ country: String(args.country ?? ""), guidance: args.guidance ? String(args.guidance) : undefined });
        return {
          data: { ok: true, angleId: r.id, country: r.country, angles: r.angles?.map((a) => a.angle_name) },
          ref: { kind: "angle", id: r.id, label: `Ángulo · ${r.country}` },
        };
      } catch {
        return { data: { error: "No se pudo generar (generate_angles es solo para admin)." } };
      }
    }
    default:
      return { data: { error: `Herramienta desconocida: ${name}` } };
  }
}

export const assistantRouter = createTRPCRouter({
  send: protectedProcedure
    .input(z.object({ message: z.string().min(1).max(4000) }))
    .mutation(async ({ ctx, input }) => {
      const role: "admin" | "user" = ctx.session.user.role === "admin" ? "admin" : "user";
      const { appRouter } = await import("@/server/api/root");
      const caller = appRouter.createCaller(ctx) as unknown as Caller;

      // RAG: recuperar contexto según la pregunta.
      const chunks = await retrieveContext(ctx.db, input.message).catch(() => []);
      const kb = chunks.map((c, i) => `[${i + 1}] (${c.source}) ${c.content}`).join("\n\n");

      const decls = TOOLS.filter((t) => !t.adminOnly || role === "admin").map((t) => t.decl);
      if (!env.GOOGLE_AI_KEY) throw new Error("Falta GOOGLE_AI_KEY en el entorno.");
      const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_KEY);
      const model = genAI.getGenerativeModel({
        model: MODEL,
        systemInstruction: buildSystem(role, ctx.session.user.name, kb),
        tools: [{ functionDeclarations: decls }],
      });

      // Contexto de la conversación desde la DB (últimas 24 h).
      const me = ctx.session.user.id;
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const prior = await ctx.db.assistantMessage.findMany({ where: { userId: me, createdAt: { gte: cutoff } }, orderBy: { createdAt: "asc" }, take: 20, select: { role: true, content: true } });
      const history: Content[] = prior.map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] }));
      const chat = model.startChat({ history });

      const toolsUsed: string[] = [];
      let pendingAction: PendingAction | null = null;
      const refs: Ref[] = [];

      let resp = await chat.sendMessage(input.message);
      for (let step = 0; step < MAX_STEPS; step++) {
        const calls = resp.response.functionCalls();
        if (!calls || calls.length === 0) break;
        const parts: Part[] = [];
        for (const call of calls) {
          toolsUsed.push(call.name);
          const { data, pendingAction: pa, ref } = await executeTool(call.name, (call.args ?? {}) as Record<string, unknown>, ctx as unknown as Ctx, caller);
          if (pa) pendingAction = pa;
          if (ref) refs.push(ref);
          parts.push({ functionResponse: { name: call.name, response: { result: data } } });
        }
        resp = await chat.sendMessage(parts);
      }

      let reply = "";
      try { reply = resp.response.text(); } catch { reply = ""; }
      if (!reply.trim()) reply = "No pude generar una respuesta. Probá reformular.";

      // Persistir + limpiar lo que pase de 24 h.
      const usedTools = [...new Set(toolsUsed)];
      await ctx.db.assistantMessage.createMany({ data: [
        { userId: me, role: "user", content: input.message },
        { userId: me, role: "assistant", content: reply, meta: { toolsUsed: usedTools, refs } },
      ] });
      await ctx.db.assistantMessage.deleteMany({ where: { userId: me, createdAt: { lt: cutoff } } });

      return { reply, toolsUsed: usedTools, pendingAction, refs };
    }),

  // Historial de las últimas 24 h del usuario.
  history: protectedProcedure.query(async ({ ctx }) => {
    const me = ctx.session.user.id;
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await ctx.db.assistantMessage.findMany({
      where: { userId: me, createdAt: { gte: cutoff } },
      orderBy: { createdAt: "asc" }, take: 100,
      select: { id: true, role: true, content: true, meta: true },
    });
    return rows.map((r) => ({ id: r.id, role: r.role === "assistant" ? ("assistant" as const) : ("user" as const), content: r.content, meta: (r.meta ?? null) as { toolsUsed?: string[]; refs?: Ref[] } | null }));
  }),

  // Nueva conversación (borra el historial del usuario).
  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.assistantMessage.deleteMany({ where: { userId: ctx.session.user.id } });
    return { ok: true };
  }),

  // Ejecuta una acción destructiva previamente confirmada por el usuario.
  runAction: protectedProcedure
    .input(z.object({ type: z.enum(["pause_vccs"]) }))
    .mutation(async ({ ctx, input }) => {
      const { appRouter } = await import("@/server/api/root");
      const caller = appRouter.createCaller(ctx) as unknown as Caller;
      if (input.type === "pause_vccs") {
        const { cards } = await caller.cards.list();
        const active = cards.filter((c) => c.status === "active" && !c.closedAt);
        let paused = 0;
        for (const c of active) { try { await caller.cards.close({ vccId: c.id }); paused++; } catch { /* best-effort */ } }
        await ctx.db.assistantMessage.create({ data: { userId: ctx.session.user.id, role: "assistant", content: `Listo — pausé ${paused} de ${active.length} VCCs.` } });
        return { type: "pause_vccs", paused, total: active.length };
      }
      return { type: input.type, paused: 0, total: 0 };
    }),
});
