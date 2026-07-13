import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/env";

const MODEL = "gemini-2.5-flash";

const SYSTEM = `Eres un experto Media Buyer y estratega de marketing digital especializado en TikTok Ads para campañas "Get Paid to Play". Analizás mercados específicos, identificás los juegos móviles más populares y generás ángulos creativos de alta conversión en formato de 2 imágenes (Hook/Situación + Proof de pago). Respondé ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni formato markdown.`;

export type AngleResult = {
  market_analysis: { trends: string[]; best_ad_hours: string[]; top_games: string[] };
  angles: Array<{
    angle_name: string;
    demographic_target: string;
    hook_text: string;
    hook_variants: string[];
    proof_text: string;
    caption: string;
    why_it_works: string;
  }>;
};

function buildPrompt(o: { country: string; operableHours?: string; kb?: string[]; metrics?: string }): string {
  const kb = o.kb?.length ? o.kb.map((k, i) => `${i + 1}. ${k}`).join("\n") : "Sin base de conocimientos previa para este país.";
  return `País Objetivo: ${o.country}
Demografía: 18-40+ años.
Horario operable local (referencia para best_ad_hours): ${o.operableHours ?? "07:30 – 22:00"}
Base de Conocimientos (aprendizajes previos de qué ángulos convierten):
${kb}
Métricas Históricas de Campañas: ${o.metrics ?? "sin métricas históricas todavía"}

Realizá lo siguiente:
1. Analizá el mercado actual en ${o.country}: tendencias de Gen Z/Millennials, humor, eventos cercanos y las mejores horas locales para correr TikTok Ads.
2. Identificá los 3 juegos móviles (App Store/Play Store) más populares actualmente en ese país que sirvan como excusa realista para el "Get Paid to Play".
3. Generá 3 opciones de ángulos creativos (ej. "El estudiante sin dinero", "El oficinista aburrido", "El que descubre un hack").
4. Para cada ángulo generá:
   - hook_text: texto en pantalla (Imagen 1) planteando la situación.
   - hook_variants: 2 variantes alternativas del hook.
   - proof_text: texto que irá SOBRE la captura real de pago del usuario (Imagen 2).
   - caption: descripción del video con CTA.
   - why_it_works: por qué debería convertir según el mercado y las métricas.

Devolvé estrictamente este JSON:
{
  "market_analysis": { "trends": ["",""], "best_ad_hours": ["",""], "top_games": ["","",""] },
  "angles": [
    { "angle_name": "", "demographic_target": "", "hook_text": "", "hook_variants": ["",""], "proof_text": "", "caption": "", "why_it_works": "" }
  ]
}`;
}

function parseJson(text: string): AngleResult {
  let t = text.trim();
  if (t.startsWith("```")) t = t.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const first = t.indexOf("{"), last = t.lastIndexOf("}");
  if (first >= 0 && last > first) t = t.slice(first, last + 1);
  return JSON.parse(t) as AngleResult;
}

/** Agente 1: genera ángulos + análisis de mercado para un país. */
export async function generateAngles(o: { country: string; operableHours?: string; kb?: string[]; metrics?: string }): Promise<AngleResult> {
  const key = env.GOOGLE_AI_KEY;
  if (!key) throw new Error("Falta GOOGLE_AI_KEY en el entorno.");
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM,
    generationConfig: { responseMimeType: "application/json", temperature: 0.95 },
  });
  const res = await model.generateContent(buildPrompt(o));
  return parseJson(res.response.text());
}
