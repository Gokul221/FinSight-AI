import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGenerateContent } = vi.hoisted(() => ({ mockGenerateContent: vi.fn() }));
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAIMock() {
    return { models: { generateContent: mockGenerateContent } };
  }),
  Type: {
    OBJECT: "OBJECT",
    ARRAY: "ARRAY",
    STRING: "STRING",
    NUMBER: "NUMBER",
    INTEGER: "INTEGER",
    BOOLEAN: "BOOLEAN",
  },
}));

import { generateChatResponse, generateInsights, parseInsightResponse } from "./llm";

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

describe("parseInsightResponse", () => {
  it("parses a plain JSON object with an insights array", () => {
    const items = parseInsightResponse(
      JSON.stringify({ insights: [{ text: "HDFC Bank is 18% of your portfolio.", severity: "warning" }] })
    );

    expect(items).toEqual([{ text: "HDFC Bank is 18% of your portfolio.", severity: "warning" }]);
  });

  it("parses a bare JSON array of insights", () => {
    const items = parseInsightResponse(JSON.stringify([{ text: "TCS is up 5%.", severity: "info" }]));
    expect(items).toEqual([{ text: "TCS is up 5%.", severity: "info" }]);
  });

  it("tolerates a fenced ```json code block wrapper", () => {
    const items = parseInsightResponse(
      "```json\n" + JSON.stringify({ insights: [{ text: "Alert!", severity: "alert" }] }) + "\n```"
    );
    expect(items).toEqual([{ text: "Alert!", severity: "alert" }]);
  });

  it("drops malformed individual items but keeps valid ones", () => {
    const items = parseInsightResponse(
      JSON.stringify({
        insights: [
          { text: "Valid item", severity: "info" },
          { text: "", severity: "info" },
          { text: "Bad severity", severity: "critical" },
          { severity: "info" },
        ],
      })
    );
    expect(items).toEqual([{ text: "Valid item", severity: "info" }]);
  });

  it("throws on an empty response", () => {
    expect(() => parseInsightResponse(undefined)).toThrow();
    expect(() => parseInsightResponse("")).toThrow();
  });

  it("throws on unparseable JSON", () => {
    expect(() => parseInsightResponse("not json")).toThrow();
  });

  it("throws when the JSON has no insights array", () => {
    expect(() => parseInsightResponse(JSON.stringify({ foo: "bar" }))).toThrow();
  });

  it("throws when every item is malformed", () => {
    expect(() => parseInsightResponse(JSON.stringify({ insights: [{ text: "" }] }))).toThrow();
  });
});

describe("generateInsights", () => {
  it("requests JSON output and parses the model's structured response", async () => {
    mockGenerateContent.mockResolvedValue({
      text: JSON.stringify({ insights: [{ text: "Diversify beyond IT.", severity: "warning" }] }),
    });

    const result = await generateInsights(
      {
        totalValue: 100000,
        totalPnL: 5000,
        totalPnLPercent: 5,
        holdings: [{ ticker: "TCS", sector: "IT", weight: 100, pnlPercent: 5 }],
      },
      [{ name: "IT", value: 100 }]
    );

    expect(result).toEqual([{ text: "Diversify beyond IT.", severity: "warning" }]);

    const call = mockGenerateContent.mock.calls[0][0];
    expect(call.model).toBe("gemini-3.5-flash");
    expect(call.config.responseMimeType).toBe("application/json");
    expect(call.config.systemInstruction).toContain("TCS");
    expect(call.config.systemInstruction).toContain("IT: 100%");
  });

  it("propagates a parse failure rather than fabricating insights", async () => {
    mockGenerateContent.mockResolvedValue({ text: "not valid json" });

    await expect(
      generateInsights({ totalValue: 0, totalPnL: 0, totalPnLPercent: 0, holdings: [] })
    ).rejects.toThrow();
  });
});
