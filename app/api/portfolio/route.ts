import { connectToDatabase } from "@/lib/db/connect";
import { Holding, type HoldingDocument } from "@/models/Holding";
import { isPositiveNumber } from "@/lib/validation";
import { serializeHolding, resolveSectorName, withComputedFields, portfolioTotals } from "@/lib/portfolio";
import { computeRiskScore } from "@/lib/riskScore";
import { ensureTodaySnapshot } from "@/lib/portfolioSnapshot";
import { getAuthenticatedUserId } from "@/lib/session";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const holdings = (await Holding.find({ userId })) as HoldingDocument[];
  const rawHoldings = holdings.map(serializeHolding);
  const computedHoldings = withComputedFields(rawHoldings);
  const riskScore = computeRiskScore(computedHoldings);

  // Snapshotting today's value (for the performance chart's history) is a
  // side effect of viewing the portfolio, not core to this response — a
  // failure here (e.g. the Nifty fetch or a DB hiccup) must never break the
  // main portfolio payload.
  try {
    const { totalValue } = portfolioTotals(computedHoldings);
    await ensureTodaySnapshot(userId, totalValue);
  } catch (error) {
    console.warn("Failed to record today's portfolio snapshot:", error);
  }

  return Response.json({ holdings: rawHoldings, riskScore });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const ticker = typeof body?.ticker === "string" ? body.ticker.trim().toUpperCase() : "";
  const sector = typeof body?.sector === "string" ? body.sector.trim() : "";
  const quantity = Number(body?.quantity);
  const avgBuyPrice = Number(body?.avgBuyPrice);
  const currentPrice = Number.isFinite(Number(body?.currentPrice)) && body?.currentPrice !== undefined
    ? Number(body.currentPrice)
    : avgBuyPrice;

  if (!name || !ticker || !sector) {
    return Response.json({ error: "Name, ticker, and sector are required." }, { status: 400 });
  }
  if (!isPositiveNumber(quantity) || quantity <= 0) {
    return Response.json({ error: "Quantity must be a positive number." }, { status: 400 });
  }
  if (!isPositiveNumber(avgBuyPrice)) {
    return Response.json({ error: "Average buy price must be a non-negative number." }, { status: 400 });
  }

  await connectToDatabase();
  const existingSectors = (await Holding.distinct("sector", { userId })) as string[];
  const holding = (await Holding.create({
    userId,
    name,
    ticker,
    quantity,
    avgBuyPrice,
    currentPrice,
    sector: resolveSectorName(sector, existingSectors),
  })) as HoldingDocument;

  await logActivity(userId, "trade", `Added ${quantity} share${quantity === 1 ? "" : "s"} of ${ticker} to your portfolio`);

  return Response.json({ holding: serializeHolding(holding) }, { status: 201 });
}
