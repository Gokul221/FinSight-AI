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

export interface MonthlyReturnPoint {
  month: string;
  portfolioReturn: number;
  niftyReturn: number | null;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthLabelFromDate(date: string): string {
  const monthIndex = Number(date.slice(5, 7)) - 1;
  return MONTH_LABELS[monthIndex] ?? date.slice(5, 7);
}

// Aggregates daily snapshots into monthly % returns for the "Monthly Returns"
// bar chart. For each calendar month, the last snapshot dated within that
// month stands in for the month's closing value (there's no guarantee every
// day has a snapshot — this just picks the one closest to month-end among
// what actually exists). Each populated month's return is computed against
// the prior populated month's close, so the first populated month never
// appears in the output (there's nothing to compare it to). Nifty's return is
// left null for a given month if either endpoint snapshot is missing a
// niftyValue. Result is capped to the most recent 6 populated months.
export function computeMonthlyReturns(snapshots: RawSnapshot[]): MonthlyReturnPoint[] {
  if (snapshots.length === 0) return [];

  const sorted = [...snapshots].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  // Overwriting as we walk ascending order leaves each month key pointing at
  // its latest (closest-to-month-end) snapshot.
  const monthlyClose = new Map<string, RawSnapshot>();
  for (const s of sorted) {
    monthlyClose.set(s.date.slice(0, 7), s);
  }

  const months = [...monthlyClose.keys()].sort();
  const points: MonthlyReturnPoint[] = [];

  for (let i = 1; i < months.length; i++) {
    const prev = monthlyClose.get(months[i - 1])!;
    const curr = monthlyClose.get(months[i])!;

    const portfolioReturn =
      prev.portfolioValue !== 0 ? ((curr.portfolioValue - prev.portfolioValue) / prev.portfolioValue) * 100 : 0;

    const niftyReturn =
      typeof prev.niftyValue === "number" && typeof curr.niftyValue === "number" && prev.niftyValue !== 0
        ? ((curr.niftyValue - prev.niftyValue) / prev.niftyValue) * 100
        : null;

    points.push({
      month: monthLabelFromDate(curr.date),
      portfolioReturn,
      niftyReturn,
    });
  }

  return points.slice(-6);
}
