import type { HoldingDocument } from "@/models/Holding";
import { serializeHolding, withComputedFields, portfolioTotals, computeSectorAllocation } from "@/lib/portfolio";
import type { PortfolioContext, SectorAllocationContext, InsightSeverity } from "@/lib/llm";

export interface SerializedInsight {
  id: string;
  text: string;
  severity: InsightSeverity;
}

interface SerializableInsightDocument {
  _id: { toString(): string };
  text: string;
  severity: string;
}

export function serializeInsight(insight: SerializableInsightDocument): SerializedInsight {
  return {
    id: insight._id.toString(),
    text: insight.text,
    severity: insight.severity as InsightSeverity,
  };
}

// Shared by both the GET bootstrap and the POST refresh route — builds the
// same structured portfolio/sector context that lib/llm's generateInsights
// expects, from the user's real holdings.
export function buildPortfolioInsightContext(
  rawHoldingDocs: HoldingDocument[]
): { portfolio: PortfolioContext; sectors: SectorAllocationContext[] } {
  const holdings = withComputedFields(rawHoldingDocs.map((h) => serializeHolding(h)));
  const totals = portfolioTotals(holdings);
  const sectors = computeSectorAllocation(holdings);

  return {
    portfolio: {
      ...totals,
      holdings: holdings.map((h) => ({
        ticker: h.ticker,
        sector: h.sector,
        weight: h.weight,
        pnlPercent: h.pnlPercent,
      })),
    },
    sectors,
  };
}
