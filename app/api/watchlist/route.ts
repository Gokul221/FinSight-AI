import { connectToDatabase } from "@/lib/db/connect";
import { Watchlist, type WatchlistDocument } from "@/models/Watchlist";
import { isPositiveNumber } from "@/lib/validation";
import { serializeWatchlistItem } from "@/lib/watchlist";
import { getAuthenticatedUserId } from "@/lib/session";
import { getNseQuotes } from "@/lib/marketData";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const items = (await Watchlist.find({ userId })) as WatchlistDocument[];

  return Response.json({ items: items.map(serializeWatchlistItem) });
}

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const ticker = typeof body?.ticker === "string" ? body.ticker.trim().toUpperCase() : "";
  const direction = body?.direction === "above" || body?.direction === "below" ? body.direction : "";
  const targetPrice = Number(body?.targetPrice);

  if (!name || !ticker) {
    return Response.json({ error: "Name and ticker are required." }, { status: 400 });
  }
  if (!direction) {
    return Response.json({ error: "Direction must be 'above' or 'below'." }, { status: 400 });
  }
  if (!isPositiveNumber(targetPrice) || targetPrice <= 0) {
    return Response.json({ error: "Target price must be a positive number." }, { status: 400 });
  }

  const quotes = await getNseQuotes([ticker]);
  const currentPrice = quotes.get(ticker) ?? targetPrice;

  await connectToDatabase();
  const item = (await Watchlist.create({
    userId,
    name,
    ticker,
    targetPrice,
    currentPrice,
    direction,
  })) as WatchlistDocument;

  return Response.json({ item: serializeWatchlistItem(item) }, { status: 201 });
}
