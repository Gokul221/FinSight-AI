import { connectToDatabase } from "@/lib/db/connect";
import { Watchlist, type WatchlistDocument } from "@/models/Watchlist";
import { isPositiveNumber } from "@/lib/validation";
import { serializeWatchlistItem } from "@/lib/watchlist";
import { getAuthenticatedUserId } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const updates: Record<string, unknown> = {};

  if (body?.targetPrice !== undefined) {
    const targetPrice = Number(body.targetPrice);
    if (!isPositiveNumber(targetPrice) || targetPrice <= 0) {
      return Response.json({ error: "Target price must be a positive number." }, { status: 400 });
    }
    updates.targetPrice = targetPrice;
  }
  if (body?.direction !== undefined) {
    if (body.direction !== "above" && body.direction !== "below") {
      return Response.json({ error: "Direction must be 'above' or 'below'." }, { status: 400 });
    }
    updates.direction = body.direction;
  }

  await connectToDatabase();
  const item = (await Watchlist.findOneAndUpdate(
    { _id: id, userId },
    { $set: updates },
    { new: true }
  )) as WatchlistDocument | null;

  if (!item) {
    return Response.json({ error: "Watchlist item not found." }, { status: 404 });
  }

  return Response.json({ item: serializeWatchlistItem(item) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectToDatabase();
  const item = (await Watchlist.findOneAndDelete({ _id: id, userId })) as WatchlistDocument | null;

  if (!item) {
    return Response.json({ error: "Watchlist item not found." }, { status: 404 });
  }

  return Response.json({ success: true });
}
