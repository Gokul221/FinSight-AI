import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockEmbed } = vi.hoisted(() => ({ mockEmbed: vi.fn() }));
vi.mock("voyageai", () => ({
  VoyageAIClient: vi.fn().mockImplementation(function VoyageAIClientMock() {
    return { embed: mockEmbed };
  }),
}));

import { cosineSimilarity, embedDocumentChunks, embedQuery } from "./embeddings";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("embedDocumentChunks", () => {
  it("returns an empty array without calling the API for empty input", async () => {
    const result = await embedDocumentChunks([]);
    expect(result).toEqual([]);
    expect(mockEmbed).not.toHaveBeenCalled();
  });

  it("requests document-type embeddings for each chunk in order", async () => {
    mockEmbed.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2] }, { embedding: [0.3, 0.4] }],
    });

    const result = await embedDocumentChunks(["chunk one", "chunk two"]);

    expect(mockEmbed).toHaveBeenCalledWith({
      input: ["chunk one", "chunk two"],
      model: "voyage-4",
      inputType: "document",
    });
    expect(result).toEqual([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);
  });
});

describe("embedQuery", () => {
  it("requests a query-type embedding for a single string", async () => {
    mockEmbed.mockResolvedValue({ data: [{ embedding: [0.5, 0.6] }] });

    const result = await embedQuery("what is my portfolio value");

    expect(mockEmbed).toHaveBeenCalledWith({
      input: "what is my portfolio value",
      model: "voyage-4",
      inputType: "query",
    });
    expect(result).toEqual([0.5, 0.6]);
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it("returns 0 rather than NaN for a zero vector", () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});
