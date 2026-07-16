import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/Watchlist", () => ({
  Watchlist: { find: vi.fn(), bulkWrite: vi.fn() },
}));

vi.mock("@/lib/marketData", () => ({
  getNseQuotes: vi.fn(),
}));

import { signAuthToken } from "@/lib/auth";
import { Watchlist } from "@/models/Watchlist";
import { getNseQuotes } from "@/lib/marketData";
import { POST } from "./route";

function authedCookie(sub = "user-1") {
  const token = signAuthToken({ sub, email: "ada@example.com" });
  mockCookieStore.get.mockReturnValue({ value: token });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/watchlist/refresh", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await POST();
    expect(res.status).toBe(401);
    expect(Watchlist.find).not.toHaveBeenCalled();
  });

  it("returns an empty result without fetching quotes when there are no watchlist items", async () => {
    authedCookie("user-1");
    (Watchlist.find as any).mockResolvedValue([]);

    const res = await POST();
    const json = await res.json();

    expect(getNseQuotes).not.toHaveBeenCalled();
    expect(json).toEqual({ items: [], updated: 0 });
  });

  it("updates currentPrice for tickers with a live quote and leaves others untouched", async () => {
    authedCookie("user-1");
    (Watchlist.find as any)
      .mockResolvedValueOnce([
        { _id: "w1", ticker: "INFY", userId: "user-1" },
        { _id: "w2", ticker: "WIPRO", userId: "user-1" },
      ])
      .mockResolvedValueOnce([
        {
          _id: { toString: () => "w1" },
          name: "Infosys",
          ticker: "INFY",
          targetPrice: 1600,
          currentPrice: 1580,
          direction: "above",
        },
        {
          _id: { toString: () => "w2" },
          name: "Wipro",
          ticker: "WIPRO",
          targetPrice: 480,
          currentPrice: 471,
          direction: "below",
        },
      ]);
    (getNseQuotes as any).mockResolvedValue(new Map([["INFY", 1580]]));

    const res = await POST();
    const json = await res.json();

    expect(Watchlist.bulkWrite).toHaveBeenCalledWith([
      {
        updateOne: {
          filter: { _id: "w1", userId: "user-1" },
          update: { $set: { currentPrice: 1580 } },
        },
      },
    ]);
    expect(json.updated).toBe(1);
    expect(json.items).toHaveLength(2);
  });
});
