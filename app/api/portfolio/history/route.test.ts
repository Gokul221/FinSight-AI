import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCookieStore = { get: vi.fn(), set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

const mockLimit = vi.fn();
const mockSort = vi.fn(() => ({ limit: mockLimit }));
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
  mockSort.mockReturnValue({ limit: mockLimit });
});

describe("GET /api/portfolio/history", () => {
  it("returns 401 when there is no session cookie", async () => {
    mockCookieStore.get.mockReturnValue(undefined);

    const res = await GET();
    expect(res.status).toBe(401);
    expect(PortfolioSnapshot.find).not.toHaveBeenCalled();
  });

  it("returns an empty points array when the user has no snapshots yet", async () => {
    authedCookie("user-1");
    mockLimit.mockResolvedValue([]);

    const res = await GET();
    const json = await res.json();

    expect(PortfolioSnapshot.find).toHaveBeenCalledWith({ userId: "user-1" });
    expect(mockSort).toHaveBeenCalledWith({ date: -1 });
    expect(json.points).toEqual([]);
  });

  it("returns a single point when there's only one snapshot, without crashing", async () => {
    authedCookie("user-1");
    mockLimit.mockResolvedValue([{ date: "2026-07-17", portfolioValue: 250000, niftyValue: 24350 }]);

    const res = await GET();
    const json = await res.json();

    expect(json.points).toEqual([{ date: "2026-07-17", portfolio: 250000, nifty: 250000 }]);
  });

  it("reverses the descending DB order back to oldest-first and rebases nifty values", async () => {
    authedCookie("user-1");
    mockLimit.mockResolvedValue([
      { date: "2026-07-17", portfolioValue: 220000, niftyValue: 24480 },
      { date: "2026-07-16", portfolioValue: 210000, niftyValue: 24000 },
    ]);

    const res = await GET();
    const json = await res.json();

    expect(json.points.map((p: { date: string }) => p.date)).toEqual(["2026-07-16", "2026-07-17"]);
    expect(json.points[0].nifty).toBeCloseTo(210000, 5);
    expect(json.points[1].nifty).toBeCloseTo(214200, 5);
  });
});
