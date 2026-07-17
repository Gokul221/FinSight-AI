import { GoogleGenAI, Type } from "@google/genai";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CHAT_MODEL = "gemini-3.5-flash";
const INSIGHT_MODEL = "gemini-3.5-flash";

export interface RetrievedChunk {
  documentName: string;
  text: string;
}

export interface PortfolioContext {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  holdings: { ticker: string; sector: string; weight: number; pnlPercent: number }[];
}

export interface ChatHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

function buildSystemPrompt(retrievedChunks: RetrievedChunk[], portfolio: PortfolioContext): string {
  const documentContext =
    retrievedChunks.length > 0
      ? retrievedChunks.map((c, i) => `[Source ${i + 1}: ${c.documentName}]\n${c.text}`).join("\n\n")
      : "No relevant documents found in the knowledge base.";

  const portfolioContext =
    portfolio.holdings.length > 0
      ? [
          `Total portfolio value: ₹${portfolio.totalValue.toLocaleString("en-IN")}`,
          `Total P&L: ₹${portfolio.totalPnL.toLocaleString("en-IN")} (${portfolio.totalPnLPercent.toFixed(2)}%)`,
          "Holdings:",
          ...portfolio.holdings.map(
            (h) => `- ${h.ticker} (${h.sector}): ${h.weight}% of portfolio, ${h.pnlPercent.toFixed(2)}% P&L`
          ),
        ].join("\n")
      : "The user has no holdings in their portfolio yet.";

  return `You are FinSight AI, a financial assistant for the user's personal investment portfolio. Answer using the user's real portfolio data and the retrieved document excerpts below. If the documents don't contain relevant information for the question, say so explicitly rather than inventing facts. Keep answers concise and specific to Indian markets (₹, NSE).

USER'S PORTFOLIO:
${portfolioContext}

RETRIEVED DOCUMENT EXCERPTS:
${documentContext}`;
}

export async function generateChatResponse(
  question: string,
  history: ChatHistoryTurn[],
  retrievedChunks: RetrievedChunk[],
  portfolio: PortfolioContext
): Promise<string> {
  const contents = [
    ...history.map((turn) => ({
      role: turn.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: turn.content }],
    })),
    { role: "user" as const, parts: [{ text: question }] },
  ];

  const response = await gemini.models.generateContent({
    model: CHAT_MODEL,
    contents,
    config: {
      systemInstruction: buildSystemPrompt(retrievedChunks, portfolio),
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 1024,
    },
  });

  return response.text ?? "";
}

export type InsightSeverity = "warning" | "info" | "alert";

export interface InsightItem {
  text: string;
  severity: InsightSeverity;
}

export interface SectorAllocationContext {
  name: string;
  value: number;
}

const insightResponseSchema = {
  type: Type.OBJECT,
  properties: {
    insights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["warning", "info", "alert"] },
        },
        required: ["text", "severity"],
      },
    },
  },
  required: ["insights"],
};

function buildInsightSystemPrompt(portfolio: PortfolioContext, sectors: SectorAllocationContext[]): string {
  const holdingsContext =
    portfolio.holdings.length > 0
      ? portfolio.holdings
          .map((h) => `- ${h.ticker} (${h.sector}): ${h.weight}% of portfolio, ${h.pnlPercent.toFixed(2)}% P&L`)
          .join("\n")
      : "No holdings.";

  const sectorContext =
    sectors.length > 0
      ? sectors.map((s) => `- ${s.name}: ${s.value}%`).join("\n")
      : "No sector allocation available.";

  return `You are FinSight AI, a financial assistant generating a short list of portfolio insights for the user's dashboard. Given the user's real holdings, sector allocation, and P&L below, return 3 to 5 short, concrete, specific insights — things like concentration risk, notable P&L movers, sector overweights, or diversification suggestions. Do not invent facts (prices, news, earnings dates) that aren't derivable from the data given. Keep each insight to one sentence, specific to Indian markets (₹, NSE).

USER'S PORTFOLIO:
Total value: ₹${portfolio.totalValue.toLocaleString("en-IN")}
Total P&L: ₹${portfolio.totalPnL.toLocaleString("en-IN")} (${portfolio.totalPnLPercent.toFixed(2)}%)

Holdings:
${holdingsContext}

Sector allocation:
${sectorContext}

Respond with JSON matching this shape: { "insights": [{ "text": string, "severity": "warning" | "info" | "alert" }] }. Use "warning" for concentration/rebalancing concerns, "info" for neutral observations, and "alert" for anything more urgent (e.g. a large unrealized loss).`;
}

// Fenced-code-block tolerant JSON extraction — the model is asked for raw
// JSON via responseMimeType, but this guards against it wrapping the reply
// in a ```json fence anyway.
function extractJsonPayload(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : text).trim();
}

// Parses and validates the model's JSON reply into insight items, dropping
// any malformed entries. Throws if the response can't be parsed as JSON, or
// contains no valid items at all — callers should not fabricate insights on
// a malformed response.
export function parseInsightResponse(text: string | undefined): InsightItem[] {
  if (!text || !text.trim()) {
    throw new Error("Empty insight response from Gemini");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonPayload(text));
  } catch (error) {
    throw new Error(`Failed to parse insight response as JSON: ${error instanceof Error ? error.message : error}`);
  }

  const rawItems = Array.isArray(parsed) ? parsed : (parsed as { insights?: unknown })?.insights;
  if (!Array.isArray(rawItems)) {
    throw new Error("Insight response did not contain an insights array");
  }

  const validSeverities: InsightSeverity[] = ["warning", "info", "alert"];
  const items: InsightItem[] = [];
  for (const item of rawItems) {
    const text = (item as { text?: unknown })?.text;
    const severity = (item as { severity?: unknown })?.severity;
    if (
      typeof text === "string" &&
      text.trim().length > 0 &&
      typeof severity === "string" &&
      (validSeverities as string[]).includes(severity)
    ) {
      items.push({ text: text.trim(), severity: severity as InsightSeverity });
    }
  }

  if (items.length === 0) {
    throw new Error("Insight response contained no valid items");
  }

  return items;
}

export async function generateInsights(
  portfolio: PortfolioContext,
  sectors: SectorAllocationContext[] = []
): Promise<InsightItem[]> {
  const response = await gemini.models.generateContent({
    model: INSIGHT_MODEL,
    contents: [{ role: "user", parts: [{ text: "Generate my portfolio insights." }] }],
    config: {
      systemInstruction: buildInsightSystemPrompt(portfolio, sectors),
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      responseSchema: insightResponseSchema,
    },
  });

  return parseInsightResponse(response.text);
}
