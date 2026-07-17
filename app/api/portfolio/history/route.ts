import { connectToDatabase } from "@/lib/db/connect";
import { PortfolioSnapshot, type PortfolioSnapshotDocument } from "@/models/PortfolioSnapshot";
import { getAuthenticatedUserId } from "@/lib/session";
import { buildPortfolioHistoryPoints } from "@/lib/portfolioSnapshot";

const HISTORY_WINDOW_DAYS = 180;

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  // Take the most recent HISTORY_WINDOW_DAYS snapshots (descending), then
  // reverse to return them oldest-first for the chart.
  const recentDescending = (await PortfolioSnapshot.find({ userId })
    .sort({ date: -1 })
    .limit(HISTORY_WINDOW_DAYS)) as PortfolioSnapshotDocument[];
  const snapshots = recentDescending.reverse();

  return Response.json({ points: buildPortfolioHistoryPoints(snapshots) });
}
