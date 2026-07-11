import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/connect";
import { Holding, type HoldingDocument } from "@/models/Holding";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { isPositiveNumber } from "@/lib/validation";

function serializeHolding(holding: HoldingDocument) {
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

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? verifyAuthToken(token) : null;

  if (!payload) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const holdings = (await Holding.find({ userId: payload.sub })) as HoldingDocument[];

  return Response.json({ holdings: holdings.map(serializeHolding) });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? verifyAuthToken(token) : null;

  if (!payload) {
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
    userId: payload.sub,
    name,
    ticker,
    quantity,
    avgBuyPrice,
    currentPrice,
    sector,
  })) as HoldingDocument;

  return Response.json({ holding: serializeHolding(holding) }, { status: 201 });
}
