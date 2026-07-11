import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

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
