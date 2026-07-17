import { connectToDatabase } from "@/lib/db/connect";
import { Insight, type InsightDocument } from "@/models/Insight";
import { Holding, type HoldingDocument } from "@/models/Holding";
import { getAuthenticatedUserId } from "@/lib/session";
import { serializeInsight, buildPortfolioInsightContext } from "@/lib/insights";
import { generateInsights } from "@/lib/llm";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  let items = (await Insight.find({ userId }).sort({ createdAt: -1 })) as InsightDocument[];

  // First-ever load for this user (no insights stored at all yet): bootstrap
  // once so the feed isn't empty on a brand-new account. A Gemini failure
  // here must not break the dashboard — fall back to an empty list rather
  // than a 500.
  if (items.length === 0) {
    try {
      const rawHoldings = (await Holding.find({ userId })) as HoldingDocument[];
      const { portfolio, sectors } = buildPortfolioInsightContext(rawHoldings);
      const generated = await generateInsights(portfolio, sectors);
      items = (await Insight.insertMany(
        generated.map((g) => ({ userId, text: g.text, severity: g.severity }))
      )) as InsightDocument[];
    } catch (error) {
      console.warn("Failed to bootstrap AI insights:", error);
      return Response.json({ insights: [] });
    }
  }

  return Response.json({ insights: items.map(serializeInsight) });
}
