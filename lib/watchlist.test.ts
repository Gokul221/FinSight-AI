import { describe, expect, it } from "vitest";
import { isTriggered, withComputedFields, type RawWatchlistItem } from "./watchlist";

function raw(overrides: Partial<RawWatchlistItem> = {}): RawWatchlistItem {
  return {
    id: "1",
    name: "Infosys",
    ticker: "INFY",
    targetPrice: 1600,
    currentPrice: 1550,
    direction: "above",
    ...overrides,
  };
}

describe("isTriggered", () => {
  it("triggers an 'above' watch once the price meets or exceeds target", () => {
    expect(isTriggered(raw({ direction: "above", currentPrice: 1599 }))).toBe(false);
    expect(isTriggered(raw({ direction: "above", currentPrice: 1600 }))).toBe(true);
    expect(isTriggered(raw({ direction: "above", currentPrice: 1601 }))).toBe(true);
  });

  it("triggers a 'below' watch once the price meets or drops under target", () => {
    expect(isTriggered(raw({ direction: "below", currentPrice: 1601 }))).toBe(false);
    expect(isTriggered(raw({ direction: "below", currentPrice: 1600 }))).toBe(true);
    expect(isTriggered(raw({ direction: "below", currentPrice: 1599 }))).toBe(true);
  });
});

describe("withComputedFields", () => {
  it("derives gapPercent and triggered without mutating stored fields", () => {
    const [item] = withComputedFields([raw({ targetPrice: 1000, currentPrice: 1100, direction: "above" })]);
    expect(item.gapPercent).toBeCloseTo(10, 5);
    expect(item.triggered).toBe(true);
  });

  it("returns a negative gapPercent when price is below target", () => {
    const [item] = withComputedFields([raw({ targetPrice: 1000, currentPrice: 900, direction: "above" })]);
    expect(item.gapPercent).toBeCloseTo(-10, 5);
    expect(item.triggered).toBe(false);
  });

  it("returns 0 gapPercent for an empty list without dividing by zero", () => {
    expect(withComputedFields([])).toEqual([]);
  });
});
