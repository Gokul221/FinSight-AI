import { connectToDatabase } from "@/lib/db/connect";
import { Insight, type InsightDocument } from "@/models/Insight";
import { Holding, type HoldingDocument } from "@/models/Holding";
import { getAuthenticatedUserId } from "@/lib/session";
import { serializeInsight, buildPortfolioInsightContext } from "@/lib/insights";
import { generateInsights } from "@/lib/llm";

export async function POST() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const rawHoldings = (await Holding.find({ userId })) as HoldingDocument[];
  const { portfolio, sectors } = buildPortfolioInsightContext(rawHoldings);

  let generated;
  try {
    generated = await generateInsights(portfolio, sectors);
  } catch (error) {
    console.error("Failed to refresh AI insights:", error);
    return Response.json({ error: "Failed to generate new insights. Please try again." }, { status: 502 });
  }

  // Bulk-replace: today's fresh insights fully supersede whatever was cached
  // before, same bulk-refresh spirit as the watchlist's refresh endpoint.
  await Insight.deleteMany({ userId });
  const created = (await Insight.insertMany(
    generated.map((g) => ({ userId, text: g.text, severity: g.severity }))
  )) as InsightDocument[];

  return Response.json({ insights: created.map(serializeInsight) });
}
