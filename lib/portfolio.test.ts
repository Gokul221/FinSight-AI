import { describe, expect, it } from "vitest";
import {
  computeSectorAllocation,
  portfolioTotals,
  resolveSectorName,
  withComputedFields,
  type RawHolding,
} from "./portfolio";

function raw(overrides: Partial<RawHolding> = {}): RawHolding {
  return {
    id: "1",
    name: "Tata Consultancy Services",
    ticker: "TCS",
    quantity: 10,
    avgBuyPrice: 3000,
    currentPrice: 3200,
    sector: "IT",
    ...overrides,
  };
}

describe("withComputedFields", () => {
  it("derives currentValue, pnl, pnlPercent, and weight", () => {
    const [h] = withComputedFields([raw()]);
    expect(h.currentValue).toBe(32000);
    expect(h.pnl).toBe(2000);
    expect(h.pnlPercent).toBeCloseTo(6.6667, 3);
    expect(h.weight).toBe(100);
  });

  it("splits weight proportionally across multiple holdings", () => {
    const holdings = withComputedFields([
      raw({ id: "1", quantity: 10, currentPrice: 100 }), // value 1000
      raw({ id: "2", ticker: "INFY", quantity: 10, currentPrice: 300 }), // value 3000
    ]);
    expect(holdings[0].weight).toBe(25);
    expect(holdings[1].weight).toBe(75);
  });

  it("returns 0 pnlPercent and weight for an empty list without dividing by zero", () => {
    expect(withComputedFields([])).toEqual([]);
  });
});

describe("resolveSectorName", () => {
  it("reuses an existing sector's casing on a case-insensitive match", () => {
    expect(resolveSectorName("it", ["IT", "Banking"])).toBe("IT");
    expect(resolveSectorName("BANKING", ["IT", "Banking"])).toBe("Banking");
  });

  it("returns the input unchanged when no existing sector matches", () => {
    expect(resolveSectorName("Pharma", ["IT", "Banking"])).toBe("Pharma");
  });

  it("returns the input unchanged when there are no existing sectors", () => {
    expect(resolveSectorName("IT", [])).toBe("IT");
  });
});

describe("portfolioTotals", () => {
  it("sums value and pnl across holdings and derives an overall pnl percent", () => {
    const holdings = withComputedFields([
      raw({ id: "1", quantity: 10, avgBuyPrice: 100, currentPrice: 120 }),
      raw({ id: "2", ticker: "INFY", quantity: 5, avgBuyPrice: 200, currentPrice: 180 }),
    ]);
    const totals = portfolioTotals(holdings);

    expect(totals.totalValue).toBe(2100); // 1200 + 900
    expect(totals.totalPnL).toBe(100); // 200 + -100
    expect(totals.totalPnLPercent).toBeCloseTo(5, 5); // 100 / 2000 cost basis
  });

  it("returns zeroed totals for an empty portfolio", () => {
    expect(portfolioTotals([])).toEqual({ totalValue: 0, totalPnL: 0, totalPnLPercent: 0 });
  });
});

describe("computeSectorAllocation", () => {
  it("returns an empty array for an empty portfolio", () => {
    expect(computeSectorAllocation([])).toEqual([]);
  });

  it("groups holdings by sector and computes percentage of total value", () => {
    const holdings = withComputedFields([
      raw({ id: "1", sector: "IT", quantity: 10, currentPrice: 100 }), // 1000
      raw({ id: "2", ticker: "INFY", sector: "IT", quantity: 10, currentPrice: 100 }), // 1000
      raw({ id: "3", ticker: "HDFCBANK", sector: "Banking", quantity: 10, currentPrice: 200 }), // 2000
    ]);

    const allocation = computeSectorAllocation(holdings);
    const banking = allocation.find((a) => a.name === "Banking");
    const it = allocation.find((a) => a.name === "IT");

    expect(it?.value).toBe(50);
    expect(banking?.value).toBe(50);
  });

  it("assigns colors deterministically by alphabetical sector order", () => {
    const holdings = withComputedFields([
      raw({ id: "1", sector: "Banking", quantity: 1, currentPrice: 100 }),
      raw({ id: "2", sector: "Energy", quantity: 1, currentPrice: 100 }),
    ]);
    const allocation = computeSectorAllocation(holdings);

    expect(allocation.map((a) => a.name)).toEqual(["Banking", "Energy"]);
    expect(allocation[0].color).not.toBe(allocation[1].color);
  });

  it("folds sectors beyond the palette size into a single 'Other' bucket", () => {
    const sectorNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const holdings = withComputedFields(
      sectorNames.map((sector, i) => raw({ id: String(i), sector, quantity: 1, currentPrice: 100 }))
    );

    const allocation = computeSectorAllocation(holdings);
    const other = allocation.find((a) => a.name === "Other");

    expect(allocation).toHaveLength(9); // 8 palette slots + Other
    expect(other).toBeDefined();
    expect(other?.value).toBeCloseTo(20, 5); // 2 of 10 equal-value sectors overflow
  });
});
