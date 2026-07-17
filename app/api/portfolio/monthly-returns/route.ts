import { connectToDatabase } from "@/lib/db/connect";
import { PortfolioSnapshot, type PortfolioSnapshotDocument } from "@/models/PortfolioSnapshot";
import { getAuthenticatedUserId } from "@/lib/session";
import { computeMonthlyReturns } from "@/lib/portfolioSnapshot";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const snapshots = (await PortfolioSnapshot.find({ userId }).sort({ date: 1 })) as PortfolioSnapshotDocument[];

  return Response.json({ points: computeMonthlyReturns(snapshots) });
}
