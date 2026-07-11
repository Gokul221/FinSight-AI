import { GoogleGenAI } from "@google/genai";

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CHAT_MODEL = "gemini-3.5-flash";

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
