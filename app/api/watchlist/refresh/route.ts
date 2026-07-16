import { connectToDatabase } from "@/lib/db/connect";
import { Watchlist, type WatchlistDocument } from "@/models/Watchlist";
import { serializeWatchlistItem } from "@/lib/watchlist";
import { getAuthenticatedUserId } from "@/lib/session";
import { getNseQuotes } from "@/lib/marketData";

export async function POST() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const items = (await Watchlist.find({ userId })) as WatchlistDocument[];

  if (items.length === 0) {
    return Response.json({ items: [], updated: 0 });
  }

  const tickers = [...new Set(items.map((i) => i.ticker))];
  const prices = await getNseQuotes(tickers);

  if (prices.size > 0) {
    await Watchlist.bulkWrite(
      items
        .filter((i) => prices.has(i.ticker))
        .map((i) => ({
          updateOne: {
            filter: { _id: i._id, userId },
            update: { $set: { currentPrice: prices.get(i.ticker) } },
          },
        }))
    );
  }

  const updated = (await Watchlist.find({ userId })) as WatchlistDocument[];
  return Response.json({ items: updated.map(serializeWatchlistItem), updated: prices.size });
}
