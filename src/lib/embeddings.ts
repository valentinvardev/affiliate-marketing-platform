import { GoogleGenerativeAI, TaskType, type EmbedContentRequest } from "@google/generative-ai";
import { env } from "@/env";

// gemini-embedding-001 es Matryoshka: pedimos 768 dims (pgvector HNSW indexa hasta 2000).
// Debe coincidir con vector(768) en la DB.
const MODEL = "gemini-embedding-001";
export const EMBED_DIMS = 768;

function client() {
  const key = env.GOOGLE_AI_KEY;
  if (!key) throw new Error("Falta GOOGLE_AI_KEY en el entorno.");
  return new GoogleGenerativeAI(key).getGenerativeModel({ model: MODEL });
}

// El SDK v0.24 no tipa `outputDimensionality` aunque la API sí lo acepta → cast.
function mkReq(text: string, taskType: TaskType): EmbedContentRequest {
  return {
    content: { role: "user", parts: [{ text }] },
    taskType,
    outputDimensionality: EMBED_DIMS,
  } as EmbedContentRequest;
}

/** Embeddea texto para GUARDAR en la base de conocimientos (RETRIEVAL_DOCUMENT). */
export async function embedDocument(text: string): Promise<number[]> {
  const res = await client().embedContent(mkReq(text, TaskType.RETRIEVAL_DOCUMENT));
  return res.embedding.values;
}

/** Embeddea la pregunta del usuario para BUSCAR (RETRIEVAL_QUERY). */
export async function embedQuery(text: string): Promise<number[]> {
  const res = await client().embedContent(mkReq(text, TaskType.RETRIEVAL_QUERY));
  return res.embedding.values;
}

/** Embeddea varios documentos de una (más eficiente para la ingesta). */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await client().batchEmbedContents({
    requests: texts.map((text) => mkReq(text, TaskType.RETRIEVAL_DOCUMENT)),
  });
  return res.embeddings.map((e) => e.values);
}

/** Serializa un vector al literal que espera pgvector en SQL crudo: '[0.1,0.2,...]'. */
export function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}
