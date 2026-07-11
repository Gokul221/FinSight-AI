import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/marketData", () => ({
  getNseMarketMovers: vi.fn(),
  POPULAR_NSE_TICKERS: ["RELIANCE", "TCS"],
}));

import { getAuthenticatedUserId } from "@/lib/session";
import { getNseMarketMovers } from "@/lib/marketData";
import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/market-movers", () => {
  it("returns 401 when there is no session", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    expect(getNseMarketMovers).not.toHaveBeenCalled();
  });

  it("returns live movers for the fixed watchlist", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    (getNseMarketMovers as any).mockResolvedValue([
      { ticker: "TCS", name: "TCS", price: 3847, change: 42, changePercent: 1.1, sparkline: [1, 2, 3] },
    ]);

    const res = await GET();
    const json = await res.json();

    expect(getNseMarketMovers).toHaveBeenCalledWith(["RELIANCE", "TCS"]);
    expect(res.status).toBe(200);
    expect(json.movers).toHaveLength(1);
  });
});
