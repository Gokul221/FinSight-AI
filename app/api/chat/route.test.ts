import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/Message", () => ({
  Message: { find: vi.fn(), create: vi.fn() },
}));

vi.mock("@/models/Chunk", () => ({
  Chunk: { find: vi.fn() },
}));

vi.mock("@/models/Holding", () => ({
  Holding: { find: vi.fn() },
}));

vi.mock("@/lib/embeddings", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/embeddings")>();
  return { ...actual, embedQuery: vi.fn() };
});

vi.mock("@/lib/llm", () => ({
  generateChatResponse: vi.fn(),
}));

import { getAuthenticatedUserId } from "@/lib/session";
import { Message } from "@/models/Message";
import { Chunk } from "@/models/Chunk";
import { Holding } from "@/models/Holding";
import { embedQuery } from "@/lib/embeddings";
import { generateChatResponse } from "@/lib/llm";
import { GET, POST } from "./route";

function makeRequest(body?: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function makeMessage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: { toString: () => "m1" },
    role: "user",
    content: "hello",
    sources: [],
    createdAt: new Date("2026-01-01T10:30:00Z"),
    ...overrides,
  };
}

function makeChunk(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: { toString: () => "c1" },
    documentId: { toString: () => "doc1" },
    documentName: "report.pdf",
    text: "TCS grew revenue by 10% this quarter.",
    embedding: [1, 0, 0],
    order: 0,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/chat", () => {
  it("returns 401 when there is no session", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns the user's messages, serialized, oldest first", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    const sort = vi.fn().mockResolvedValue([makeMessage()]);
    (Message.find as any).mockReturnValue({ sort });

    const res = await GET();
    const json = await res.json();

    expect(Message.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
    expect(res.status).toBe(200);
    expect(json.messages[0]).toMatchObject({ id: "m1", role: "user", content: "hello" });
  });
});

describe("POST /api/chat", () => {
  it("returns 401 when there is no session", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue(null);

    const res = await POST(makeRequest({ content: "hi" }));
    expect(res.status).toBe(401);
    expect(Message.create).not.toHaveBeenCalled();
  });

  it("returns 400 for empty content", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");

    const res = await POST(makeRequest({ content: "   " }));
    expect(res.status).toBe(400);
    expect(Message.create).not.toHaveBeenCalled();
  });

  it("retrieves the most similar chunks, grounds the reply in real portfolio data, and persists both messages", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");

    const userMsg = makeMessage({ _id: { toString: () => "u1" }, role: "user", content: "How is TCS doing?" });
    const assistantMsg = makeMessage({
      _id: { toString: () => "a1" },
      role: "assistant",
      content: "TCS is doing well.",
      sources: [{ documentId: { toString: () => "doc1" }, documentName: "report.pdf", excerpt: "TCS grew...", relevanceScore: 100 }],
    });
    (Message.create as any).mockResolvedValueOnce(userMsg).mockResolvedValueOnce(assistantMsg);

    const closeChunk = makeChunk({ embedding: [1, 0, 0], text: "TCS grew revenue by 10%." });
    const farChunk = makeChunk({
      _id: { toString: () => "c2" },
      documentName: "unrelated.pdf",
      text: "Weather report.",
      embedding: [0, 1, 0],
    });
    (Chunk.find as any).mockResolvedValue([farChunk, closeChunk]);
    (embedQuery as any).mockResolvedValue([1, 0, 0]); // identical to closeChunk's embedding

    (Holding.find as any).mockResolvedValue([
      {
        _id: { toString: () => "h1" },
        name: "Tata Consultancy Services",
        ticker: "TCS",
        quantity: 10,
        avgBuyPrice: 3000,
        currentPrice: 3300,
        sector: "IT",
      },
    ]);

    const historySort = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([userMsg]) });
    (Message.find as any).mockReturnValue({ sort: historySort });

    (generateChatResponse as any).mockResolvedValue("TCS is doing well.");

    const res = await POST(makeRequest({ content: "How is TCS doing?" }));
    const json = await res.json();

    expect(Message.create).toHaveBeenNthCalledWith(1, { userId: "user-1", role: "user", content: "How is TCS doing?" });

    // Retrieval should rank the identical-embedding chunk first.
    const [question, history, retrievedChunks, portfolio] = (generateChatResponse as any).mock.calls[0];
    expect(question).toBe("How is TCS doing?");
    expect(history).toEqual([]); // only the just-added user message was in history, and it's excluded
    expect(retrievedChunks[0]).toEqual({ documentName: "report.pdf", text: "TCS grew revenue by 10%." });
    expect(portfolio.holdings).toEqual([{ ticker: "TCS", sector: "IT", weight: 100, pnlPercent: 10 }]);
    expect(portfolio.totalValue).toBe(33000);

    expect(Message.create).toHaveBeenNthCalledWith(2, {
      userId: "user-1",
      role: "assistant",
      content: "TCS is doing well.",
      sources: expect.arrayContaining([
        expect.objectContaining({ documentName: "report.pdf", relevanceScore: 100 }),
      ]),
    });

    expect(res.status).toBe(200);
    expect(json.userMessage.id).toBe("u1");
    expect(json.assistantMessage.id).toBe("a1");
  });

  it("skips retrieval and embedQuery entirely when the user has no documents", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    (Message.create as any)
      .mockResolvedValueOnce(makeMessage())
      .mockResolvedValueOnce(makeMessage({ role: "assistant", content: "No documents yet." }));
    (Chunk.find as any).mockResolvedValue([]);
    (Holding.find as any).mockResolvedValue([]);
    const historySort = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });
    (Message.find as any).mockReturnValue({ sort: historySort });
    (generateChatResponse as any).mockResolvedValue("No documents yet.");

    await POST(makeRequest({ content: "hello" }));

    expect(embedQuery).not.toHaveBeenCalled();
    const [, , retrievedChunks, portfolio] = (generateChatResponse as any).mock.calls[0];
    expect(retrievedChunks).toEqual([]);
    expect(portfolio.holdings).toEqual([]);
  });

  it("still persists an assistant reply when generation fails, instead of leaving the question orphaned", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");

    const userMsg = makeMessage({ _id: { toString: () => "u1" }, role: "user", content: "hello" });
    const assistantMsg = makeMessage({
      _id: { toString: () => "a1" },
      role: "assistant",
      content: "Sorry, I ran into an error processing that. Please try again.",
    });
    (Message.create as any).mockResolvedValueOnce(userMsg).mockResolvedValueOnce(assistantMsg);

    (Chunk.find as any).mockResolvedValue([]);
    (Holding.find as any).mockResolvedValue([]);
    const historySort = vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) });
    (Message.find as any).mockReturnValue({ sort: historySort });
    (generateChatResponse as any).mockRejectedValue(new Error("model not found"));

    const res = await POST(makeRequest({ content: "hello" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(Message.create).toHaveBeenNthCalledWith(2, {
      userId: "user-1",
      role: "assistant",
      content: "Sorry, I ran into an error processing that. Please try again.",
      sources: [],
    });
    expect(json.assistantMessage.id).toBe("a1");
  });
});
