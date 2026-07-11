import { connectToDatabase } from "@/lib/db/connect";
import { Holding, type HoldingDocument } from "@/models/Holding";
import { isPositiveNumber } from "@/lib/validation";
import { serializeHolding } from "@/lib/portfolio";
import { getAuthenticatedUserId } from "@/lib/session";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const holdings = (await Holding.find({ userId })) as HoldingDocument[];

  return Response.json({ holdings: holdings.map(serializeHolding) });
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
  const holding = (await Holding.create({
    userId,
    name,
    ticker,
    quantity,
    avgBuyPrice,
    currentPrice,
    sector,
  })) as HoldingDocument;

  await logActivity(userId, "trade", `Added ${quantity} share${quantity === 1 ? "" : "s"} of ${ticker} to your portfolio`);

  return Response.json({ holding: serializeHolding(holding) }, { status: 201 });
}
