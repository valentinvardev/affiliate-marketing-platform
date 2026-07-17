import { randomUUID } from "node:crypto";
import { embedQuery, embedDocuments, toVectorLiteral } from "@/lib/embeddings";

type DB = typeof import("@/server/db").db;

export type RetrievedChunk = { content: string; source: string; similarity: number };

/** Busca en KnowledgeChunk los fragmentos más parecidos a la consulta (coseno vía pgvector). */
export async function retrieveContext(db: DB, query: string, topK = 5, minSim = 0.35): Promise<RetrievedChunk[]> {
  const q = query.trim();
  if (!q) return [];
  const lit = toVectorLiteral(await embedQuery(q));
  const k = Math.max(1, Math.min(20, topK));
  const rows = await db.$queryRawUnsafe<{ content: string; source: string; sim: number }[]>(
    `SELECT "content", "source", 1 - ("embedding" <=> '${lit}'::vector) AS sim
     FROM "KnowledgeChunk"
     WHERE "embedding" IS NOT NULL
     ORDER BY "embedding" <=> '${lit}'::vector
     LIMIT ${k}`,
  );
  return rows
    .map((r) => ({ content: r.content, source: r.source, similarity: Number(r.sim) }))
    .filter((r) => r.similarity >= minSim);
}

/** Parte un texto largo en chunks (~maxChars) respetando párrafos, con solape. */
export function chunkText(text: string, maxChars = 1200, overlap = 150): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const paras = clean.split(/\n{2,}/);
  const chunks: string[] = [];
  let cur = "";
  for (const p of paras) {
    if (cur && (cur + "\n\n" + p).length > maxChars) {
      chunks.push(cur.trim());
      cur = cur.slice(Math.max(0, cur.length - overlap)) + "\n\n" + p;
    } else {
      cur = cur ? cur + "\n\n" + p : p;
    }
  }
  if (cur.trim()) chunks.push(cur.trim());

  // Cortar cualquier chunk todavía gigante (un párrafo único muy largo).
  const out: string[] = [];
  for (const c of chunks) {
    if (c.length <= maxChars) { out.push(c); continue; }
    for (let i = 0; i < c.length; i += maxChars - overlap) out.push(c.slice(i, i + maxChars).trim());
  }
  return out.filter(Boolean);
}

/** Embeddea e inserta chunks en KnowledgeChunk (en lotes, para la ingesta del hito 6). */
export async function ingestChunks(db: DB, opts: { source: string; kind?: string; createdById?: string | null; chunks: string[] }): Promise<number> {
  const BATCH = 100; // límite razonable por request de embeddings
  let total = 0;
  for (let i = 0; i < opts.chunks.length; i += BATCH) {
    const batch = opts.chunks.slice(i, i + BATCH);
    const vecs = await embedDocuments(batch);
    for (let j = 0; j < batch.length; j++) {
      await db.$executeRawUnsafe(
        `INSERT INTO "KnowledgeChunk" ("id","source","kind","content","embedding","createdById") VALUES ($1,$2,$3,$4,$5::vector,$6)`,
        randomUUID(), opts.source, opts.kind ?? "manual", batch[j], toVectorLiteral(vecs[j]!), opts.createdById ?? null,
      );
    }
    total += batch.length;
  }
  return total;
}

/** Borra todos los chunks de una fuente (para reindexar). */
export async function clearSource(db: DB, source: string): Promise<void> {
  await db.$executeRawUnsafe(`DELETE FROM "KnowledgeChunk" WHERE "source" = $1`, source);
}
