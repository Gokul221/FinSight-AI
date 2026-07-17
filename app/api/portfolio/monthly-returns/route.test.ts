import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

const mockSort = vi.fn();
vi.mock("@/models/PortfolioSnapshot", () => ({
  PortfolioSnapshot: { find: vi.fn(() => ({ sort: mockSort })) },
}));

import { signAuthToken } from "@/lib/auth";
import { PortfolioSnapshot } from "@/models/PortfolioSnapshot";
import { GET } from "./route";

function authedCookie(sub = "user-1") {
  const token = signAuthToken({ sub, email: "ada@example.com" });
  mockCookieStore.get.mockReturnValue({ value: token });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/portfolio/monthly-returns", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await GET();
    expect(res.status).toBe(401);
    expect(PortfolioSnapshot.find).not.toHaveBeenCalled();
  });

  it("returns an empty points array when the user has no snapshots yet", async () => {
    authedCookie("user-1");
    mockSort.mockResolvedValue([]);

    const res = await GET();
    const json = await res.json();

    expect(PortfolioSnapshot.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(mockSort).toHaveBeenCalledWith({ date: 1 });
    expect(json.points).toEqual([]);
  });

  it("aggregates multiple months of snapshots into monthly returns", async () => {
    authedCookie("user-1");
    mockSort.mockResolvedValue([
      { date: "2026-05-31", portfolioValue: 200000, niftyValue: 24000 },
      { date: "2026-06-30", portfolioValue: 220000, niftyValue: 24480 },
      { date: "2026-07-17", portfolioValue: 209000, niftyValue: null },
    ]);

    const res = await GET();
    const json = await res.json();

    expect(json.points).toEqual([
      { month: "Jun", portfolioReturn: 10, niftyReturn: 2 },
      { month: "Jul", portfolioReturn: -5, niftyReturn: null },
    ]);
  });
});
