import { describe, expect, it } from "vitest";
import { chunkText } from "./chunking";

describe("chunkText", () => {
  it("returns an empty array for empty text", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("keeps short text as a single chunk", () => {
    const text = "Paragraph one.\n\nParagraph two.";
    expect(chunkText(text)).toEqual([text]);
  });

  it("splits into multiple chunks once the length limit is exceeded, each within the limit", () => {
    const paragraph = "a".repeat(1500);
    const text = [paragraph, paragraph, paragraph].join("\n\n");

    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(2000);
    }
  });

  it("hard-splits a single paragraph that alone exceeds the limit, preserving all text", () => {
    const hugeParagraph = "b".repeat(5000);

    const chunks = chunkText(hugeParagraph);

    expect(chunks).toHaveLength(3); // 2000 + 2000 + 1000
    expect(chunks.join("")).toBe(hugeParagraph);
  });
});
