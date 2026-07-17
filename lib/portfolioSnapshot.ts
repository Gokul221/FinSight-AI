import { connectToDatabase } from "@/lib/db/connect";
import { PortfolioSnapshot } from "@/models/PortfolioSnapshot";
import { getNiftyIndexValue } from "@/lib/marketData";

// UTC calendar date as YYYY-MM-DD — the snapshot "day" bucket.
export function todayUtcDateString(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

// Upserts today's portfolio value snapshot, idempotently — calling this more
// than once on the same UTC day just refreshes the same document rather than
// creating a duplicate. If the Nifty fetch fails, niftyValue is simply left
// out of the update so an earlier successful value for today (if any) isn't
// clobbered with null.
export async function ensureTodaySnapshot(
  userId: string,
  portfolioValue: number,
  now: Date = new Date()
): Promise<void> {
  await connectToDatabase();
  const date = todayUtcDateString(now);
  const niftyValue = await getNiftyIndexValue();

  const update: Record<string, number> = { portfolioValue };
  if (niftyValue !== null) {
    update.niftyValue = niftyValue;
  }

  await PortfolioSnapshot.findOneAndUpdate(
    { userId, date },
    { $set: update },
    { upsert: true, new: true }
  );
}

export interface PortfolioHistoryPoint {
  date: string;
  portfolio: number;
  nifty: number | null;
}

interface RawSnapshot {
  date: string;
  portfolioValue: number;
  niftyValue?: number | null;
}

// The chart shares a single Y-axis between the portfolio (₹ value, ~lakhs)
// and the Nifty index (~24,000 points), so Nifty is rebased to the
// portfolio's own scale at read time: rebasedNifty = niftyValue /
// niftyAtFirstSnapshot * portfolioAtFirstSnapshot. This makes the two lines
// visually comparable ("if I'd put this money in the index instead") without
// ever storing anything but the true raw index value in the DB.
export function buildPortfolioHistoryPoints(snapshots: RawSnapshot[]): PortfolioHistoryPoint[] {
  if (snapshots.length === 0) return [];

  const baseline = snapshots.find((s) => typeof s.niftyValue === "number");
  const baselineNifty = baseline?.niftyValue ?? null;
  const baselinePortfolio = baseline?.portfolioValue ?? null;

  return snapshots.map((s) => {
    const canRebase =
      baselineNifty !== null && baselinePortfolio !== null && typeof s.niftyValue === "number" && baselineNifty !== 0;

    return {
      date: s.date,
      portfolio: s.portfolioValue,
      nifty: canRebase ? (s.niftyValue! / baselineNifty!) * baselinePortfolio! : null,
    };
  });
}
