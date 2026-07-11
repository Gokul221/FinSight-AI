import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/session", () => ({
  getAuthenticatedUserId: vi.fn(),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/Holding", () => ({
  Holding: { find: vi.fn(), bulkWrite: vi.fn() },
}));

vi.mock("@/lib/marketData", () => ({
  getNseQuotes: vi.fn(),
}));

import { getAuthenticatedUserId } from "@/lib/session";
import { Holding } from "@/models/Holding";
import { getNseQuotes } from "@/lib/marketData";
import { POST } from "./route";

function makeHolding(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: { toString: () => "h1" },
    name: "Tata Consultancy Services",
    ticker: "TCS",
    quantity: 10,
    avgBuyPrice: 3000,
    currentPrice: 3000,
    sector: "IT",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/portfolio/refresh-prices", () => {
  it("returns 401 when there is no session", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue(null);

    const res = await POST();
    expect(res.status).toBe(401);
    expect(Holding.find).not.toHaveBeenCalled();
  });

  it("returns an empty result without calling the market data API when the user has no holdings", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    (Holding.find as any).mockResolvedValue([]);

    const res = await POST();
    const json = await res.json();

    expect(json).toEqual({ holdings: [], updated: 0 });
    expect(getNseQuotes).not.toHaveBeenCalled();
  });

  it("bulk-updates only holdings with a resolvable quote, scoped to the user", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    const tcsId = { toString: () => "h1" };
    (Holding.find as any)
      .mockResolvedValueOnce([
        makeHolding({ _id: tcsId, ticker: "TCS" }),
        makeHolding({ _id: { toString: () => "h2" }, ticker: "FAKETICKER" }),
      ])
      .mockResolvedValueOnce([makeHolding({ ticker: "TCS", currentPrice: 3847 })]);
    (getNseQuotes as any).mockResolvedValue(new Map([["TCS", 3847]]));

    const res = await POST();
    const json = await res.json();

    expect(getNseQuotes).toHaveBeenCalledWith(["TCS", "FAKETICKER"]);
    expect(Holding.bulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { _id: tcsId, userId: "user-1" },
          update: { $set: { currentPrice: 3847 } },
        },
      },
    ]);
    expect(json.updated).toBe(1);
    expect(json.holdings[0].currentPrice).toBe(3847);
  });

  it("skips the bulk write entirely when no quotes resolve", async () => {
    (getAuthenticatedUserId as any).mockResolvedValue("user-1");
    (Holding.find as any).mockResolvedValue([makeHolding({ ticker: "FAKETICKER" })]);
    (getNseQuotes as any).mockResolvedValue(new Map());

    const res = await POST();
    const json = await res.json();

    expect(Holding.bulkWrite).not.toHaveBeenCalled();
    expect(json.updated).toBe(0);
  });
});
