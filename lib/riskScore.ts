import type { Holding } from "@/lib/mockData";
import { computeSectorAllocation } from "@/lib/portfolio";

export type RiskLevel = "Low" | "Moderate" | "High";

export interface RiskScore {
  score: number;
  level: RiskLevel;
  topSector: string | null;
  topSectorPercent: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Concentration-based risk proxy: a Herfindahl-Hirschman Index (HHI) blended
// across sector allocation and individual holding weight. A portfolio spread
// evenly across many sectors/holdings scores low; one dominated by a single
// sector or position scores high. No volatility/beta data is available, so
// this is a deliberate concentration-only approximation, not a true risk model.
export function computeRiskScore(holdings: Holding[]): RiskScore {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  if (holdings.length === 0 || totalValue === 0) {
    return { score: 0, level: "Low", topSector: null, topSectorPercent: 0 };
  }

  const sectorAllocation = computeSectorAllocation(holdings);
  const sectorHHI = sectorAllocation.reduce((sum, s) => sum + (s.value / 100) ** 2, 0);
  const holdingHHI = holdings.reduce((sum, h) => sum + (h.weight / 100) ** 2, 0);

  const rawScore = 10 * (0.5 * sectorHHI + 0.5 * holdingHHI);
  const score = Math.round(clamp(rawScore, 0, 10) * 10) / 10;

  const level: RiskLevel = score < 4 ? "Low" : score <= 7 ? "Moderate" : "High";

  const topSector = [...sectorAllocation].sort((a, b) => b.value - a.value)[0] ?? null;

  return {
    score,
    level,
    topSector: topSector?.name ?? null,
    topSectorPercent: topSector?.value ?? 0,
  };
}
