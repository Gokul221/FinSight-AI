import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateContent } = vi.hoisted(() => ({ mockGenerateContent: vi.fn() }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAIMock() {
    return { models: { generateContent: mockGenerateContent } };
  }),
}));

import { generateChatResponse } from "./llm";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateChatResponse", () => {
  it("sends history plus the new question, with thinking disabled, on the configured model", async () => {
    mockGenerateContent.mockResolvedValue({ text: "Here's my answer." });

    const result = await generateChatResponse(
      "What is my TCS allocation?",
      [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello!" },
      ],
      [{ documentName: "report.pdf", text: "TCS grew 10%." }],
      {
        totalValue: 1000,
        totalPnL: 100,
        totalPnLPercent: 10,
        holdings: [{ ticker: "TCS", sector: "IT", weight: 100, pnlPercent: 10 }],
      }
    );

    expect(result).toBe("Here's my answer.");
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: "Hi" }] },
          { role: "model", parts: [{ text: "Hello!" }] },
          { role: "user", parts: [{ text: "What is my TCS allocation?" }] },
        ],
      })
    );

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.thinkingConfig).toEqual({ thinkingBudget: 0 });
    expect(call.config.systemInstruction).toContain("TCS");
    expect(call.config.systemInstruction).toContain("report.pdf");
  });

  it("notes explicitly when there are no relevant documents or holdings", async () => {
    mockGenerateContent.mockResolvedValue({ text: "answer" });

    await generateChatResponse("hello", [], [], {
      totalValue: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      holdings: [],
    });

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.config.systemInstruction).toContain("No relevant documents found");
    expect(call.config.systemInstruction).toContain("no holdings in their portfolio yet");
  });

  it("returns an empty string when the response has no text", async () => {
    mockGenerateContent.mockResolvedValue({ text: undefined });

    const result = await generateChatResponse("hi", [], [], {
      totalValue: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      holdings: [],
    });

    expect(result).toBe("");
  });
});
