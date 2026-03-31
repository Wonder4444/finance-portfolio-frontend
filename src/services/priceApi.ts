/**
 * Portfolio Manager API Service
 * Fetches live price data from the Neueda cached price API.
 * API: https://c4rm9elh30.execute-api.us-east-1.amazonaws.com/default/cachedPriceData
 * Available tickers: C, AMZN, TSLA, FB, AAPL
 */

const API_BASE = 'https://c4rm9elh30.execute-api.us-east-1.amazonaws.com/default/cachedPriceData';

// Available tickers in the API
export const AVAILABLE_TICKERS = ['AAPL', 'TSLA', 'AMZN', 'C', 'FB'] as const;
export type AvailableTicker = typeof AVAILABLE_TICKERS[number];

// Ticker metadata (name, type, icon)
export const TICKER_META: Record<AvailableTicker, { name: string; type: 'stock' | 'crypto' | 'fund'; icon: string }> = {
    AAPL: { name: 'Apple Inc.', type: 'stock', icon: 'https://logo.clearbit.com/apple.com' },
    TSLA: { name: 'Tesla, Inc.', type: 'stock', icon: 'https://logo.clearbit.com/tesla.com' },
    AMZN: { name: 'Amazon.com, Inc.', type: 'stock', icon: 'https://logo.clearbit.com/amazon.com' },
    C: { name: 'Citigroup Inc.', type: 'stock', icon: 'https://logo.clearbit.com/citigroup.com' },
    FB: { name: 'Meta Platforms, Inc.', type: 'stock', icon: 'https://logo.clearbit.com/meta.com' },
};

// Raw API response shape
export interface RawPriceData {
    ticker: string;
    price_data: {
        volume: number[];
        low: number[];
        high: number[];
        open: number[];
        close: number[];
        timestamp: string[];
    };
}

// Transformed OHLC bar for candlestick charts
export interface OHLCBar {
    time: string; // YYYY-MM-DD format for daily, or timestamp for intraday
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
}

// Ticker summary with latest price and change
export interface TickerSummary {
    ticker: string;
    name: string;
    type: 'stock' | 'crypto' | 'fund';
    icon: string;
    latestPrice: number;
    previousClose: number;
    change: number;
    changePercent: number;
    dayHigh: number;
    dayLow: number;
    totalVolume: number;
}

/**
 * Fetch raw price data for a single ticker from the API
 */
export async function fetchTickerData(ticker: string): Promise<RawPriceData> {
    const res = await fetch(`${API_BASE}?ticker=${encodeURIComponent(ticker)}`);
    if (!res.ok) {
        throw new Error(`Failed to fetch data for ${ticker}: ${res.status} ${res.statusText}`);
    }
    // Parse as text first and use a reviver to detect NaN values (API sometimes returns NaN)
    const text = await res.text();
    try {
        const data = JSON.parse(text) as RawPriceData;
        // Validate that the data doesn't contain NaN values
        const { close, open } = data.price_data;
        if (close.length === 0 || close.some(v => isNaN(v)) || open.some(v => isNaN(v))) {
            throw new Error(`Ticker ${ticker} returned corrupt data (NaN values detected)`);
        }
        return data;
    } catch (e) {
        throw new Error(`Failed to parse data for ${ticker}: ${(e as Error).message}`);
    }
}

/**
 * Fetch price data for all available tickers in parallel
 */
export async function fetchAllTickers(): Promise<Map<string, RawPriceData>> {
    const results = await Promise.allSettled(
        AVAILABLE_TICKERS.map(ticker => fetchTickerData(ticker))
    );

    const dataMap = new Map<string, RawPriceData>();
    results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
            dataMap.set(AVAILABLE_TICKERS[i], result.value);
        } else {
            console.warn(`Failed to fetch ${AVAILABLE_TICKERS[i]}:`, result.reason);
        }
    });

    return dataMap;
}

/**
 * Convert raw API data into OHLC bars suitable for candlestick charts.
 * The API provides 5-minute intraday data; we aggregate to daily bars for the chart.
 */
export function toOHLCBars(raw: RawPriceData): OHLCBar[] {
    const { open, high, low, close, volume, timestamp } = raw.price_data;
    const n = timestamp.length;

    // Group by date (YYYY-MM-DD)
    const dailyMap = new Map<string, { opens: number[]; highs: number[]; lows: number[]; closes: number[]; volumes: number[] }>();

    for (let i = 0; i < n; i++) {
        const date = timestamp[i].split(' ')[0]; // "2026-03-25"
        if (!dailyMap.has(date)) {
            dailyMap.set(date, { opens: [], highs: [], lows: [], closes: [], volumes: [] });
        }
        const day = dailyMap.get(date)!;
        day.opens.push(open[i]);
        day.highs.push(high[i]);
        day.lows.push(low[i]);
        day.closes.push(close[i]);
        day.volumes.push(volume[i]);
    }

    const bars: OHLCBar[] = [];
    for (const [date, data] of dailyMap.entries()) {
        bars.push({
            time: date,
            open: data.opens[0], // first open of the day
            high: Math.max(...data.highs),
            low: Math.min(...data.lows),
            close: data.closes[data.closes.length - 1], // last close of the day
            volume: data.volumes.reduce((a, b) => a + b, 0),
        });
    }

    return bars.sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Convert raw API data into 5-minute intraday OHLC bars (for detailed charts)
 */
export function toIntradayBars(raw: RawPriceData): OHLCBar[] {
    const { open, high, low, close, volume, timestamp } = raw.price_data;
    const bars: OHLCBar[] = [];

    for (let i = 0; i < timestamp.length; i++) {
        bars.push({
            time: timestamp[i],
            open: open[i],
            high: high[i],
            low: low[i],
            close: close[i],
            volume: volume[i],
        });
    }

    return bars;
}

/**
 * Generate a summary for a single ticker from raw data
 */
export function toTickerSummary(raw: RawPriceData): TickerSummary {
    const ticker = raw.ticker as AvailableTicker;
    const meta = TICKER_META[ticker] || { name: ticker, type: 'stock' as const, icon: '' };
    const { open, high, low, close, volume, timestamp } = raw.price_data;
    const n = timestamp.length;

    // Get the latest (last) close price
    const latestPrice = close[n - 1];

    // Find the previous trading day's last close for change calculation
    const lastDate = timestamp[n - 1].split(' ')[0];
    let previousClose = open[0]; // fallback: first open of the entire dataset
    for (let i = n - 1; i >= 0; i--) {
        if (timestamp[i].split(' ')[0] !== lastDate) {
            previousClose = close[i];
            break;
        }
    }

    const change = latestPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    // Day high/low for the latest trading day
    let dayHigh = -Infinity;
    let dayLow = Infinity;
    let totalVolume = 0;
    for (let i = n - 1; i >= 0; i--) {
        if (timestamp[i].split(' ')[0] !== lastDate) break;
        if (high[i] > dayHigh) dayHigh = high[i];
        if (low[i] < dayLow) dayLow = low[i];
        totalVolume += volume[i];
    }

    return {
        ticker,
        name: meta.name,
        type: meta.type,
        icon: meta.icon,
        latestPrice,
        previousClose,
        change,
        changePercent,
        dayHigh,
        dayLow,
        totalVolume,
    };
}

/**
 * Convenience: fetch all tickers and return summaries sorted by volume (highest first)
 */
export async function fetchAllTickerSummaries(): Promise<TickerSummary[]> {
    const dataMap = await fetchAllTickers();
    const summaries: TickerSummary[] = [];
    for (const [, raw] of dataMap) {
        summaries.push(toTickerSummary(raw));
    }
    return summaries.sort((a, b) => b.totalVolume - a.totalVolume);
}
