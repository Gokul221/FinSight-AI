import { VoyageAIClient } from "voyageai";

const voyage = new VoyageAIClient({ apiKey: process.env.VOYAGE_API_KEY });

const EMBEDDING_MODEL = "voyage-4";

export async function embedDocumentChunks(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const response = await voyage.embed({ input: texts, model: EMBEDDING_MODEL, inputType: "document" });
  return (response.data ?? []).map((d) => d.embedding ?? []);
}

export async function embedQuery(text: string): Promise<number[]> {
  const response = await voyage.embed({ input: text, model: EMBEDDING_MODEL, inputType: "query" });
  return response.data?.[0]?.embedding ?? [];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dot / denominator : 0;
}
