import { describe, expect, it } from "vitest";
import { computeRiskScore } from "./riskScore";
import { withComputedFields, type RawHolding } from "./portfolio";

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

describe("computeRiskScore", () => {
  it("returns a zeroed, low-risk result for an empty portfolio without dividing by zero", () => {
    expect(computeRiskScore([])).toEqual({ score: 0, level: "Low", topSector: null, topSectorPercent: 0 });
  });

  it("scores a single-holding, single-sector portfolio at maximum concentration (10/10, High)", () => {
    const holdings = withComputedFields([raw()]);
    const result = computeRiskScore(holdings);

    expect(result.score).toBe(10);
    expect(result.level).toBe("High");
    expect(result.topSector).toBe("IT");
    expect(result.topSectorPercent).toBe(100);
  });

  it("scores a portfolio spread evenly across many sectors/holdings as low risk", () => {
    const sectorNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const holdings = withComputedFields(
      sectorNames.map((sector, i) => raw({ id: String(i), ticker: `T${i}`, sector, quantity: 1, currentPrice: 100 }))
    );

    const result = computeRiskScore(holdings);

    expect(result.score).toBeLessThan(4);
    expect(result.level).toBe("Low");
  });

  it("classifies a moderately concentrated portfolio between 4 and 7 as Moderate", () => {
    // 2 sectors, one holding each: 70/30 split.
    // sectorHHI = holdingHHI = 0.7^2 + 0.3^2 = 0.58 -> score = 10 * 0.58 = 5.8
    const holdings = withComputedFields([
      raw({ id: "1", ticker: "A", sector: "IT", quantity: 1, currentPrice: 700 }),
      raw({ id: "2", ticker: "B", sector: "Banking", quantity: 1, currentPrice: 300 }),
    ]);

    const result = computeRiskScore(holdings);

    expect(result.score).toBe(5.8);
    expect(result.score).toBeGreaterThanOrEqual(4);
    expect(result.score).toBeLessThanOrEqual(7);
    expect(result.level).toBe("Moderate");
    expect(result.topSector).toBe("IT");
    expect(result.topSectorPercent).toBe(70);
  });

  it("rounds the score to one decimal place", () => {
    const holdings = withComputedFields([
      raw({ id: "1", ticker: "A", sector: "IT", quantity: 1, currentPrice: 100 }),
      raw({ id: "2", ticker: "B", sector: "Banking", quantity: 1, currentPrice: 100 }),
      raw({ id: "3", ticker: "C", sector: "Energy", quantity: 1, currentPrice: 50 }),
    ]);

    const result = computeRiskScore(holdings);
    expect(Number.isInteger(result.score * 10)).toBe(true);
  });
});
