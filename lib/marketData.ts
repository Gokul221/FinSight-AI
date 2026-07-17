import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// A fixed, general "market movers" watchlist — not tied to any user's
// holdings, just a handful of large, liquid NSE names.
export const POPULAR_NSE_TICKERS = [
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "WIPRO",
  "ICICIBANK",
];

// NSE-listed tickers need the ".NS" suffix on Yahoo Finance (e.g. TCS -> TCS.NS).
function toYahooSymbol(ticker: string): string {
  return `${ticker.toUpperCase()}.NS`;
}

// Fetches current prices for NSE tickers in a single batched request.
// Tickers that fail to resolve (delisted, typo, etc.) are simply omitted
// from the result rather than failing the whole batch.
export async function getNseQuotes(tickers: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  if (tickers.length === 0) return prices;

  const symbolToTicker = new Map(tickers.map((t) => [toYahooSymbol(t), t]));

  let quotes;
  try {
    quotes = await yahooFinance.quote([...symbolToTicker.keys()], { return: "map" });
  } catch (error) {
    console.warn(`Failed to fetch NSE quotes: ${error}`);
    return prices;
  }

  for (const [symbol, quote] of quotes) {
    const ticker = symbolToTicker.get(symbol);
    if (ticker && typeof quote?.regularMarketPrice === "number") {
      prices.set(ticker, quote.regularMarketPrice);
    }
  }

  return prices;
}

// The Nifty 50 benchmark index (^NSEI on Yahoo Finance). Used as the market
// comparison line on the portfolio performance chart. Returns null (rather
// than throwing) on failure so callers can treat "no benchmark today" as a
// normal, non-fatal case.
export async function getNiftyIndexValue(): Promise<number | null> {
  try {
    const quote = await yahooFinance.quote("^NSEI");
    return typeof quote?.regularMarketPrice === "number" ? quote.regularMarketPrice : null;
  } catch (error) {
    console.warn(`Failed to fetch Nifty index value: ${error}`);
    return null;
  }
}

export interface MarketMoverQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

// Fetches live price/change plus a trailing ~7-session close-price sparkline
// for each ticker. A ticker that fails to resolve a quote is omitted; if only
// its history fails, it's still included with an empty sparkline.
export async function getNseMarketMovers(tickers: string[]): Promise<MarketMoverQuote[]> {
  if (tickers.length === 0) return [];

  const symbolToTicker = new Map(tickers.map((t) => [toYahooSymbol(t), t]));

  let quotes;
  try {
    quotes = await yahooFinance.quote([...symbolToTicker.keys()], { return: "map" });
  } catch (error) {
    console.warn(`Failed to fetch NSE market movers: ${error}`);
    return [];
  }

  const period1 = new Date();
  period1.setDate(period1.getDate() - 14); // buffer for weekends/holidays

  const resolvable = [...quotes.entries()].filter(
    ([, quote]) => typeof quote?.regularMarketPrice === "number"
  );

  return Promise.all(
    resolvable.map(async ([symbol, quote]) => {
      const ticker = symbolToTicker.get(symbol)!;
      let sparkline: number[] = [];
      try {
        const chart = await yahooFinance.chart(symbol, { period1, interval: "1d" });
        sparkline = chart.quotes
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number")
          .slice(-7);
      } catch (error) {
        console.warn(`Failed to fetch history for ${symbol}: ${error}`);
      }

      return {
        ticker,
        name: quote.longName ?? quote.shortName ?? ticker,
        price: quote.regularMarketPrice!,
        change: quote.regularMarketChange ?? 0,
        changePercent: quote.regularMarketChangePercent ?? 0,
        sparkline,
      };
    })
  );
}
