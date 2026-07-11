import { connectToDatabase } from "@/lib/db/connect";
import { Holding, type HoldingDocument } from "@/models/Holding";
import { serializeHolding } from "@/lib/portfolio";
import { getAuthenticatedUserId } from "@/lib/session";
import { getNseQuotes } from "@/lib/marketData";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const holdings = (await Holding.find({ userId })) as HoldingDocument[];

  if (holdings.length === 0) {
    return Response.json({ holdings: [], updated: 0 });
  }

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  const prices = await getNseQuotes(tickers);

  if (prices.size > 0) {
    await Holding.bulkWrite(
      holdings
        .filter((h) => prices.has(h.ticker))
        .map((h) => ({
          updateOne: {
            filter: { _id: h._id, userId },
            update: { $set: { currentPrice: prices.get(h.ticker) } },
          },
        }))
    );
    await logActivity(
      userId,
      "price",
      `Refreshed live prices for ${prices.size} holding${prices.size === 1 ? "" : "s"}`
    );
  }

  const updated = (await Holding.find({ userId })) as HoldingDocument[];
  return Response.json({ holdings: updated.map(serializeHolding), updated: prices.size });
}
