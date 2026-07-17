import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/connect", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/PortfolioSnapshot", () => ({
  PortfolioSnapshot: { findOneAndUpdate: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@/lib/marketData", () => ({
  getNiftyIndexValue: vi.fn(),
}));

import { PortfolioSnapshot } from "@/models/PortfolioSnapshot";
import { getNiftyIndexValue } from "@/lib/marketData";
import {
  buildPortfolioHistoryPoints,
  ensureTodaySnapshot,
  todayUtcDateString,
} from "./portfolioSnapshot";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("todayUtcDateString", () => {
  it("formats a date as a UTC YYYY-MM-DD string", () => {
    expect(todayUtcDateString(new Date("2026-07-17T23:30:00Z"))).toBe("2026-07-17");
  });
});

describe("ensureTodaySnapshot", () => {
  it("upserts today's snapshot with both portfolio and nifty values on success", async () => {
    (getNiftyIndexValue as any).mockResolvedValue(24350.5);
    const now = new Date("2026-07-17T10:00:00Z");

    await ensureTodaySnapshot("user-1", 250000, now);

    expect(PortfolioSnapshot.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user-1", date: "2026-07-17" },
      { $set: { portfolioValue: 250000, niftyValue: 24350.5 } },
      { upsert: true, new: true }
    );
  });

  it("omits niftyValue from the update when the index fetch fails, so an existing value isn't clobbered", async () => {
    (getNiftyIndexValue as any).mockResolvedValue(null);
    const now = new Date("2026-07-17T10:00:00Z");

    await ensureTodaySnapshot("user-1", 250000, now);

    expect(PortfolioSnapshot.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: "user-1", date: "2026-07-17" },
      { $set: { portfolioValue: 250000 } },
      { upsert: true, new: true }
    );
  });
});

describe("buildPortfolioHistoryPoints", () => {
  it("returns an empty array for no snapshots", () => {
    expect(buildPortfolioHistoryPoints([])).toEqual([]);
  });

  it("returns a single point with the raw nifty value rebased to itself (1x) when there's only one snapshot", () => {
    const points = buildPortfolioHistoryPoints([
      { date: "2026-07-17", portfolioValue: 250000, niftyValue: 24350 },
    ]);
    expect(points).toEqual([{ date: "2026-07-17", portfolio: 250000, nifty: 250000 }]);
  });

  it("rebases nifty values against the first snapshot with a nifty reading, onto the portfolio's own scale", () => {
    const points = buildPortfolioHistoryPoints([
      { date: "2026-07-15", portfolioValue: 200000, niftyValue: 24000 },
      { date: "2026-07-16", portfolioValue: 220000, niftyValue: 24240 }, // nifty +1%
      { date: "2026-07-17", portfolioValue: 210000, niftyValue: 22800 }, // nifty -5%
    ]);

    expect(points[0]).toEqual({ date: "2026-07-15", portfolio: 200000, nifty: 200000 });
    expect(points[1].nifty).toBeCloseTo(202000, 5); // 200000 * 1.01
    expect(points[2].nifty).toBeCloseTo(190000, 5); // 200000 * 0.95
  });

  it("uses the first snapshot that has a nifty reading as the baseline when earlier ones are missing it", () => {
    const points = buildPortfolioHistoryPoints([
      { date: "2026-07-15", portfolioValue: 200000, niftyValue: null },
      { date: "2026-07-16", portfolioValue: 210000, niftyValue: 24000 },
      { date: "2026-07-17", portfolioValue: 220000, niftyValue: 24480 },
    ]);

    expect(points[0].nifty).toBeNull();
    expect(points[1].nifty).toBeCloseTo(210000, 5);
    expect(points[2].nifty).toBeCloseTo(214200, 5); // 210000 * 1.02
  });

  it("returns null nifty values for every point when no snapshot ever recorded one", () => {
    const points = buildPortfolioHistoryPoints([
      { date: "2026-07-15", portfolioValue: 200000, niftyValue: null },
      { date: "2026-07-16", portfolioValue: 210000 },
    ]);

    expect(points.every((p) => p.nifty === null)).toBe(true);
  });
});
