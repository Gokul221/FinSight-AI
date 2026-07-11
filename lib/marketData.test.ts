import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockQuote } = vi.hoisted(() => ({ mockQuote: vi.fn() }));
vi.mock("yahoo-finance2", () => ({
  default: vi.fn().mockImplementation(function YahooFinanceMock() {
    return { quote: mockQuote };
  }),
}));

import { getNseQuotes } from "./marketData";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getNseQuotes", () => {
  it("returns an empty map without calling the API for an empty ticker list", async () => {
    const result = await getNseQuotes([]);
    expect(result.size).toBe(0);
    expect(mockQuote).not.toHaveBeenCalled();
  });

  it("appends the .NS suffix and maps prices back to the plain ticker", async () => {
    mockQuote.mockResolvedValue(
      new Map([
        ["TCS.NS", { regularMarketPrice: 3847 }],
        ["HDFCBANK.NS", { regularMarketPrice: 1724 }],
      ])
    );

    const result = await getNseQuotes(["TCS", "HDFCBANK"]);

    expect(mockQuote).toHaveBeenCalledWith(["TCS.NS", "HDFCBANK.NS"], { return: "map" });
    expect(result.get("TCS")).toBe(3847);
    expect(result.get("HDFCBANK")).toBe(1724);
  });

  it("omits tickers with no resolvable quote", async () => {
    mockQuote.mockResolvedValue(new Map([["TCS.NS", { regularMarketPrice: 3847 }]]));

    const result = await getNseQuotes(["TCS", "FAKETICKER"]);

    expect(result.get("TCS")).toBe(3847);
    expect(result.has("FAKETICKER")).toBe(false);
  });

  it("returns an empty map when the whole batch request fails", async () => {
    mockQuote.mockRejectedValue(new Error("network error"));

    const result = await getNseQuotes(["TCS"]);
    expect(result.size).toBe(0);
  });
});
