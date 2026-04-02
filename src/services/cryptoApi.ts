import type { TickerSummary } from "./priceApi";

const CRYPTO_API_BASE = "/crypto-api";

export function isCryptoSymbol(symbol: string): boolean {
  return symbol.toUpperCase().endsWith("-USD");
}

interface CryptoQuoteResponse {
  quotes: Array<{
    symbol: string;
    name: string;
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
    currency: string;
  }>;
}

export async function fetchCryptoTickerSummaries(
  symbols: string[],
): Promise<TickerSummary[]> {
  const uniqueSymbols = [
    ...new Set(symbols.map((s) => s.toUpperCase())),
  ].filter(isCryptoSymbol);

  if (uniqueSymbols.length === 0) {
    return [];
  }

  const url = `${CRYPTO_API_BASE}/prices?symbols=${encodeURIComponent(uniqueSymbols.join(","))}`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      "Crypto API is unreachable. Start the app with `npm run dev` so both web and crypto services run together.",
    );
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch crypto quotes: ${response.status} ${response.statusText}`,
    );
  }

  const data: CryptoQuoteResponse = await response.json();

  return data.quotes.map((q) => ({
    ticker: q.symbol,
    name: q.name,
    type: "crypto",
    icon: "",
    latestPrice: q.price,
    previousClose: q.previousClose,
    change: q.change,
    changePercent: q.changePercent,
    dayHigh: Math.max(q.price, q.previousClose),
    dayLow: Math.min(q.price, q.previousClose),
    totalVolume: 0,
  }));
}
