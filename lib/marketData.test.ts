import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockQuote, mockChart } = vi.hoisted(() => ({ mockQuote: vi.fn(), mockChart: vi.fn() }));
vi.mock("yahoo-finance2", () => ({
  default: vi.fn().mockImplementation(function YahooFinanceMock() {
    return { quote: mockQuote, chart: mockChart };
  }),
}));

import { getNseMarketMovers, getNseQuotes } from "./marketData";

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

describe("getNseMarketMovers", () => {
  it("returns an empty array without calling the API for an empty ticker list", async () => {
    const result = await getNseMarketMovers([]);
    expect(result).toEqual([]);
    expect(mockQuote).not.toHaveBeenCalled();
  });

  it("combines quote and chart data into price/change/sparkline per ticker", async () => {
    mockQuote.mockResolvedValue(
      new Map([
        [
          "TCS.NS",
          {
            regularMarketPrice: 3847,
            regularMarketChange: 42.5,
            regularMarketChangePercent: 1.12,
            longName: "Tata Consultancy Services Ltd.",
          },
        ],
      ])
    );
    mockChart.mockResolvedValue({
      quotes: [
        { close: 3700 },
        { close: 3750 },
        { close: null }, // gaps (e.g. holidays) are dropped, not treated as 0
        { close: 3800 },
        { close: 3847 },
      ],
    });

    const [mover] = await getNseMarketMovers(["TCS"]);

    expect(mockChart).toHaveBeenCalledWith("TCS.NS", expect.objectContaining({ interval: "1d" }));
    expect(mover.ticker).toBe("TCS");
    expect(mover.name).toBe("Tata Consultancy Services Ltd.");
    expect(mover.price).toBe(3847);
    expect(mover.change).toBe(42.5);
    expect(mover.changePercent).toBe(1.12);
    expect(mover.sparkline).toEqual([3700, 3750, 3800, 3847]);
  });

  it("still includes a ticker with an empty sparkline if its history fetch fails", async () => {
    mockQuote.mockResolvedValue(new Map([["TCS.NS", { regularMarketPrice: 3847 }]]));
    mockChart.mockRejectedValue(new Error("history unavailable"));

    const [mover] = await getNseMarketMovers(["TCS"]);

    expect(mover.price).toBe(3847);
    expect(mover.sparkline).toEqual([]);
  });

  it("omits tickers with no resolvable quote entirely", async () => {
    mockQuote.mockResolvedValue(new Map());
    mockChart.mockResolvedValue({ quotes: [] });

    const result = await getNseMarketMovers(["FAKETICKER"]);
    expect(result).toEqual([]);
    expect(mockChart).not.toHaveBeenCalled();
  });

  it("returns an empty array when the whole quote batch fails", async () => {
    mockQuote.mockRejectedValue(new Error("network error"));

    const result = await getNseMarketMovers(["TCS"]);
    expect(result).toEqual([]);
  });
});
