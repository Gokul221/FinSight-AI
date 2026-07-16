import { getAuthenticatedUserId } from "@/lib/session";
import { getNseMarketMovers, POPULAR_NSE_TICKERS } from "@/lib/marketData";

export async function GET() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const movers = await getNseMarketMovers(POPULAR_NSE_TICKERS);
  return Response.json({ movers });
}
