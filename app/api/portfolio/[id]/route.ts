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

async function requireUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? verifyAuthToken(token) : null;
  return payload?.sub ?? null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const updates: Record<string, unknown> = {};

  if (body?.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return Response.json({ error: "Name must be a non-empty string." }, { status: 400 });
    }
    updates.name = body.name.trim();
  }
  if (body?.ticker !== undefined) {
    if (typeof body.ticker !== "string" || !body.ticker.trim()) {
      return Response.json({ error: "Ticker must be a non-empty string." }, { status: 400 });
    }
    updates.ticker = body.ticker.trim().toUpperCase();
  }
  if (body?.sector !== undefined) {
    if (typeof body.sector !== "string" || !body.sector.trim()) {
      return Response.json({ error: "Sector must be a non-empty string." }, { status: 400 });
    }
    updates.sector = body.sector.trim();
  }
  if (body?.quantity !== undefined) {
    const quantity = Number(body.quantity);
    if (!isPositiveNumber(quantity) || quantity <= 0) {
      return Response.json({ error: "Quantity must be a positive number." }, { status: 400 });
    }
    updates.quantity = quantity;
  }
  if (body?.avgBuyPrice !== undefined) {
    const avgBuyPrice = Number(body.avgBuyPrice);
    if (!isPositiveNumber(avgBuyPrice)) {
      return Response.json({ error: "Average buy price must be a non-negative number." }, { status: 400 });
    }
    updates.avgBuyPrice = avgBuyPrice;
  }
  if (body?.currentPrice !== undefined) {
    const currentPrice = Number(body.currentPrice);
    if (!isPositiveNumber(currentPrice)) {
      return Response.json({ error: "Current price must be a non-negative number." }, { status: 400 });
    }
    updates.currentPrice = currentPrice;
  }

  await connectToDatabase();
  const holding = (await Holding.findOneAndUpdate(
    { _id: id, userId },
    { $set: updates },
    { new: true }
  )) as HoldingDocument | null;

  if (!holding) {
    return Response.json({ error: "Holding not found." }, { status: 404 });
  }

  return Response.json({ holding: serializeHolding(holding) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectToDatabase();
  const holding = await Holding.findOneAndDelete({ _id: id, userId });

  if (!holding) {
    return Response.json({ error: "Holding not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
