import { z } from "zod";
import {
  GoogleGenerativeAI, SchemaType,
  type FunctionDeclaration, type Content, type Part,
} from "@google/generative-ai";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { retrieveContext } from "@/lib/rag";

const MODEL = "gemini-2.5-flash";
const MAX_STEPS = 6;

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

/* ── Declaración de herramientas (lo que el modelo puede pedir) ── */
const TOOLS: { decl: FunctionDeclaration; adminOnly?: boolean }[] = [
  { decl: { name: "get_finances", description: "Revenue, costo de VCC, costo de suite y profit (neto) del usuario. Un usuario normal ve solo lo suyo; un admin ve a todos. Todo el histórico.", parameters: { type: SchemaType.OBJECT, properties: {} } } },
  { decl: { name: "get_period_stats", description: "Métricas de los últimos N días del usuario: revenue, conversiones, clicks, CVR y gasto logueado. Para preguntas tipo 'cuánto facturé/gasté esta semana'.", parameters: { type: SchemaType.OBJECT, properties: { days: { type: SchemaType.NUMBER, description: "Cantidad de días hacia atrás (ej. 7 = última semana)." } }, required: ["days"] } } },
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
async function executeTool(name: string, args: Record<string, unknown>, ctx: Ctx, caller: Caller): Promise<{ data: unknown; pendingAction?: PendingAction }> {
  switch (name) {
    case "get_finances": {
      const rows = await caller.accounting.summary();
      return { data: rows };
    }
    case "get_period_stats": {
      const days = Math.max(1, Math.min(365, Number(args.days) || 7));
      const isAdmin = ctx.session.user.role === "admin";
      const me = ctx.session.user.id;
      const campaigns = await ctx.db.campaign.findMany({ where: isAdmin ? {} : { ownerId: me }, select: { slug: true } });
      const slugs = campaigns.map((c) => c.slug).filter(Boolean) as string[];
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const [convs, clicks, spend] = await Promise.all([
        ctx.db.conversion.findMany({ where: { s1: { in: slugs }, receivedAt: { gte: cutoff } }, select: { price: true } }),
        ctx.db.click.count({ where: { s1: { in: slugs }, createdAt: { gte: cutoff } } }),
        ctx.db.spendLog.aggregate({ where: { ...(isAdmin ? {} : { userId: me }), createdAt: { gte: cutoff } }, _sum: { amount: true } }),
      ]);
      const revenue = convs.reduce((s, x) => s + x.price, 0);
      return { data: { days, revenue, conversions: convs.length, clicks, cvr: clicks ? (convs.length / clicks) * 100 : 0, loggedSpend: spend._sum.amount ?? 0 } };
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
        return { data: { ok: true, angleId: r.id, country: r.country, angles: r.angles?.map((a) => a.angle_name) } };
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
    .input(z.object({
      message: z.string().min(1).max(4000),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).max(30).optional(),
    }))
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

      const history: Content[] = (input.history ?? []).map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] }));
      const chat = model.startChat({ history });

      const toolsUsed: string[] = [];
      let pendingAction: PendingAction | null = null;

      let resp = await chat.sendMessage(input.message);
      for (let step = 0; step < MAX_STEPS; step++) {
        const calls = resp.response.functionCalls();
        if (!calls || calls.length === 0) break;
        const parts: Part[] = [];
        for (const call of calls) {
          toolsUsed.push(call.name);
          const { data, pendingAction: pa } = await executeTool(call.name, (call.args ?? {}) as Record<string, unknown>, ctx as unknown as Ctx, caller);
          if (pa) pendingAction = pa;
          parts.push({ functionResponse: { name: call.name, response: { result: data } } });
        }
        resp = await chat.sendMessage(parts);
      }

      let reply = "";
      try { reply = resp.response.text(); } catch { reply = ""; }
      if (!reply.trim()) reply = "No pude generar una respuesta. Probá reformular.";

      return { reply, toolsUsed: [...new Set(toolsUsed)], pendingAction };
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
        return { type: "pause_vccs", paused, total: active.length };
      }
      return { type: input.type, paused: 0, total: 0 };
    }),
});
