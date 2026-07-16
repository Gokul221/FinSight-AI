export type WatchlistDirection = "above" | "below";

export interface RawWatchlistItem {
  id: string;
  name: string;
  ticker: string;
  targetPrice: number;
  currentPrice: number;
  direction: WatchlistDirection;
}

export interface WatchlistItem extends RawWatchlistItem {
  gapPercent: number;
  triggered: boolean;
}

interface SerializableWatchlistDocument {
  _id: { toString(): string };
  name: string;
  ticker: string;
  targetPrice: number;
  currentPrice: number;
  direction: string;
}

export function serializeWatchlistItem(item: SerializableWatchlistDocument): RawWatchlistItem {
  return {
    id: item._id.toString(),
    name: item.name,
    ticker: item.ticker,
    targetPrice: item.targetPrice,
    currentPrice: item.currentPrice,
    direction: item.direction as WatchlistDirection,
  };
}

// A "below" watch triggers once the price drops to/under target; an "above"
// watch triggers once it rises to/over target. Not stored — derived fresh
// from currentPrice each time, same as the portfolio's computed fields.
export function isTriggered(item: Pick<RawWatchlistItem, "currentPrice" | "targetPrice" | "direction">): boolean {
  return item.direction === "above"
    ? item.currentPrice >= item.targetPrice
    : item.currentPrice <= item.targetPrice;
}

export function withComputedFields(raw: RawWatchlistItem[]): WatchlistItem[] {
  return raw.map((item) => ({
    ...item,
    gapPercent: item.targetPrice > 0 ? ((item.currentPrice - item.targetPrice) / item.targetPrice) * 100 : 0,
    triggered: isTriggered(item),
  }));
}
