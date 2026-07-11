import type { Holding } from "@/lib/mockData";

export type RawHolding = Pick<
  Holding,
  "id" | "name" | "ticker" | "quantity" | "avgBuyPrice" | "currentPrice" | "sector"
>;

// currentValue/pnl/pnlPercent/weight aren't stored — they're derived from the
// raw fields returned by the API, same formulas the mock data was hand-computed with.
export function withComputedFields(raw: RawHolding[]): Holding[] {
  const withValue = raw.map((h) => {
    const currentValue = h.quantity * h.currentPrice;
    const costBasis = h.quantity * h.avgBuyPrice;
    const pnl = currentValue - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return { ...h, currentValue, pnl, pnlPercent };
  });

  const totalValue = withValue.reduce((sum, h) => sum + h.currentValue, 0);

  return withValue.map((h) => ({
    ...h,
    weight: totalValue > 0 ? Math.round((h.currentValue / totalValue) * 1000) / 10 : 0,
  }));
}
