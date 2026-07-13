import type { AllocationData, Holding } from "@/lib/mockData";

export type RawHolding = Pick<
  Holding,
  "id" | "name" | "ticker" | "quantity" | "avgBuyPrice" | "currentPrice" | "sector"
>;

interface SerializableHoldingDocument {
  _id: { toString(): string };
  name: string;
  ticker: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  sector: string;
}

export function serializeHolding(holding: SerializableHoldingDocument): RawHolding {
  return {
    id: holding._id.toString(),
    name: holding.name,
    ticker: holding.ticker,
    quantity: holding.quantity,
    avgBuyPrice: holding.avgBuyPrice,
    currentPrice: holding.currentPrice,
    sector: holding.sector,
  };
}

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

// Matches a newly entered sector against the user's existing sectors case-insensitively,
// so "IT", "it", and "It" all collapse to whichever casing was already stored — otherwise
// the allocation donut splits one sector into several due to input casing alone.
export function resolveSectorName(sector: string, existingSectors: string[]): string {
  const match = existingSectors.find((s) => s.toLowerCase() === sector.toLowerCase());
  return match ?? sector;
}

export function portfolioTotals(holdings: Holding[]) {
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  const totalPnL = holdings.reduce((s, h) => s + h.pnl, 0);
  const costBasis = totalValue - totalPnL;
  const totalPnLPercent = costBasis > 0 ? (totalPnL / costBasis) * 100 : 0;
  return { totalValue, totalPnL, totalPnLPercent };
}

// Validated categorical dark-mode palette (fixed order, never cycled — see
// dataviz skill). Sectors beyond the palette size fold into a neutral "Other"
// slot rather than generating a new hue.
const SECTOR_PALETTE = [
  "#3987e5", // blue
  "#199e70", // aqua
  "#c98500", // yellow
  "#008300", // green
  "#9085e9", // violet
  "#e66767", // red
  "#d55181", // magenta
  "#d95926", // orange
];
const OTHER_SECTOR_COLOR = "#64748B";

export function computeSectorAllocation(holdings: Holding[]): AllocationData[] {
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0);
  if (totalValue === 0) return [];

  const valueBySector = new Map<string, number>();
  for (const h of holdings) {
    valueBySector.set(h.sector, (valueBySector.get(h.sector) ?? 0) + h.currentValue);
  }

  // Sorted alphabetically so a given sector name maps to the same palette
  // slot deterministically, independent of insertion order.
  const sectors = [...valueBySector.entries()]
    .map(([name, value]) => ({ name, value: Math.round((value / totalValue) * 1000) / 10 }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const primary = sectors
    .slice(0, SECTOR_PALETTE.length)
    .map((s, i) => ({ ...s, color: SECTOR_PALETTE[i] }));

  const overflow = sectors.slice(SECTOR_PALETTE.length);
  if (overflow.length > 0) {
    const otherValue = Math.round(overflow.reduce((sum, s) => sum + s.value, 0) * 10) / 10;
    primary.push({ name: "Other", value: otherValue, color: OTHER_SECTOR_COLOR });
  }

  return primary;
}
