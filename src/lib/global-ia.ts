import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/env";
import { retrieveContext } from "@/lib/rag";

type DB = typeof import("@/server/db").db;

const MODEL = "gemini-2.5-flash";
export const IA_BOT_ID = "ia-bot";
export const IA_BOT_NAME = "IA";

/** ¿El mensaje invoca a la IA con /ia? */
export function mentionsIa(text: string): boolean {
  return /(^|\s)\/ia(\s|$)/i.test(text);
}
/** Quita el token /ia y deja el resto como pregunta. */
export function stripIa(text: string): string {
  return text.replace(/(^|\s)\/ia(\s|$)/i, " ").replace(/\s+/g, " ").trim();
}

/** Genera la respuesta de la IA para el chat global (conversacional + RAG, sin datos privados). */
export async function generateGlobalIaReply(db: DB, opts: { prompt: string; recent: { username: string; text: string }[] }): Promise<string> {
  if (!env.GOOGLE_AI_KEY) return "";
  const kb = await retrieveContext(db, opts.prompt || opts.recent.map((m) => m.text).join(" "), 5).catch(() => []);
  const kbText = kb.map((c, i) => `[${i + 1}] (${c.source}) ${c.content}`).join("\n\n");
  const convo = opts.recent.map((m) => `${m.username}: ${m.text}`).join("\n");

  const system = `Sos "IA", un miembro del chat de equipo de TapSur (media buying de TikTok Ads, nicho get-paid-to-play).
Respondé BREVE (1-3 frases), en español, con onda de colega. Es un chat GRUPAL: NUNCA reveles ni inventes datos privados o financieros de nadie (acá no tenés acceso a eso). Si te preguntan cómo funciona la plataforma o de estrategia, usá el contexto de abajo. Si no sabés, decilo simple y honesto.${kbText ? `\n\nContexto de la base de conocimientos:\n${kbText}` : ""}`;

  const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_KEY);
  const model = genAI.getGenerativeModel({ model: MODEL, systemInstruction: system, generationConfig: { temperature: 0.85 } });
  const prompt = `Conversación reciente del chat:\n${convo || "(sin mensajes)"}\n\nTe invocaron con /ia. Respondé a: ${opts.prompt || "(saludá al grupo brevemente)"}`;

  const res = await model.generateContent(prompt);
  let text = "";
  try { text = res.response.text().trim(); } catch { text = ""; }
  return text.slice(0, 1800);
}
