import { connectToDatabase } from "@/lib/db/connect";
import { Message, type MessageDocument } from "@/models/Message";
import { Chunk, type ChunkDocument } from "@/models/Chunk";
import { Holding, type HoldingDocument } from "@/models/Holding";
import { getAuthenticatedUserId } from "@/lib/session";
import { embedQuery, cosineSimilarity } from "@/lib/embeddings";
import { generateChatResponse } from "@/lib/llm";
import { serializeHolding, withComputedFields, portfolioTotals } from "@/lib/portfolio";

const TOP_K = 5;
const HISTORY_TURNS = 20;

function serializeMessage(msg: MessageDocument) {
  return {
    id: msg._id.toString(),
    role: msg.role,
    content: msg.content,
    timestamp: msg.createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    sources: msg.sources.map((s, i) => ({
      id: `${s.documentId.toString()}-${i}`,
      docName: s.documentName,
      section: `Excerpt ${i + 1}`,
      excerpt: s.excerpt,
      relevanceScore: s.relevanceScore,
    })),
  };
}

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const messages = (await Message.find({ userId }).sort({ createdAt: 1 })) as MessageDocument[];

  return Response.json({ messages: messages.map(serializeMessage) });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) {
    return Response.json({ error: "Message content is required." }, { status: 400 });
  }

  await connectToDatabase();

  const userMessage = (await Message.create({ userId, role: "user", content })) as MessageDocument;

  // Retrieval: rank every stored chunk for this user by similarity to the question.
  const allChunks = (await Chunk.find({ userId })) as ChunkDocument[];
  let topMatches: { chunk: ChunkDocument; score: number }[] = [];
  if (allChunks.length > 0) {
    const queryEmbedding = await embedQuery(content);
    topMatches = allChunks
      .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K);
  }

  // Structured portfolio context, injected directly (not retrieved via embeddings).
  const rawHoldings = (await Holding.find({ userId })) as HoldingDocument[];
  const holdings = withComputedFields(rawHoldings.map((h) => serializeHolding(h)));
  const totals = portfolioTotals(holdings);

  // Recent conversational history, oldest first, excluding the message just saved above.
  const historyDocs = (await Message.find({ userId })
    .sort({ createdAt: -1 })
    .limit(HISTORY_TURNS + 1)) as MessageDocument[];
  const history = historyDocs
    .slice(1)
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const replyText = await generateChatResponse(
    content,
    history,
    topMatches.map(({ chunk }) => ({ documentName: chunk.documentName, text: chunk.text })),
    {
      ...totals,
      holdings: holdings.map((h) => ({
        ticker: h.ticker,
        sector: h.sector,
        weight: h.weight,
        pnlPercent: h.pnlPercent,
      })),
    }
  );

  const assistantMessage = (await Message.create({
    userId,
    role: "assistant",
    content: replyText,
    sources: topMatches.map(({ chunk, score }) => ({
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      excerpt: chunk.text.slice(0, 240),
      relevanceScore: Math.round(score * 100),
    })),
  })) as MessageDocument;

  return Response.json({
    userMessage: serializeMessage(userMessage),
    assistantMessage: serializeMessage(assistantMessage),
  });
}
