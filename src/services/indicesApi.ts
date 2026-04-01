/**
 * Market Indices API Service
 * Fetches live index data (S&P 500, Nasdaq, etc.) via Yahoo Finance,
 * proxied through Vite dev server to avoid CORS issues.
 *
 * Proxy route: /yahoo-finance -> query1.finance.yahoo.com
 */

// Use the Vite proxy path (no CORS issues in dev)
const YAHOO_BASE = '/yahoo-finance/v8/finance/chart';

// ── Index metadata ───────────────────────────────────────────────────
export interface IndexMeta {
    symbol: string;        // Yahoo symbol, e.g. "^GSPC"
    name: string;          // Display name
    displaySymbol: string; // Short code shown in the badge
    currency: string;
    icon: string;          // Icon text / code  (used by MarketSummary)
    iconColor: string;     // Tailwind bg class
    type: string;          // "D" for delayed, "" for real-time label
}

export const INDEX_LIST: IndexMeta[] = [
    { symbol: '^NDX', name: 'Nasdaq 100', displaySymbol: 'NDX', currency: 'USD', icon: '100', iconColor: 'bg-[#00a8e8]', type: 'D' },
    { symbol: '^N225', name: 'Japan 225', displaySymbol: 'NI225', currency: 'JPY', icon: '225', iconColor: 'bg-[#1e3a8a]', type: '' },
    { symbol: '000001.SS', name: 'SSE Composite', displaySymbol: '000001', currency: 'CNY', icon: 'SSE', iconColor: 'bg-[#1e3a8a]', type: 'D' },
    { symbol: '^FTSE', name: 'FTSE 100', displaySymbol: 'UKX', currency: 'GBP', icon: 'GB', iconColor: '', type: 'D' },
    { symbol: '^GDAXI', name: 'DAX', displaySymbol: 'DAX', currency: 'EUR', icon: 'X', iconColor: 'bg-[#2563eb]', type: 'D' },
    { symbol: '^FCHI', name: 'CAC 40', displaySymbol: 'PX1', currency: 'EUR', icon: '40', iconColor: 'bg-[#059669]', type: 'D' },
];

export const SP500_META: IndexMeta = {
    symbol: '^GSPC', name: 'S&P 500', displaySymbol: 'SPX',
    currency: 'USD', icon: '500', iconColor: 'bg-[#cb2d3e]', type: '',
};

// ── Types ────────────────────────────────────────────────────────────
export interface IndexQuote {
    symbol: string;
    name: string;
    displaySymbol: string;
    currency: string;
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
    icon: string;
    iconColor: string;
    type: string;
    isLive: boolean;
}

export interface ChartPoint {
    time: number;  // unix timestamp (seconds)
    value: number;
}

// ── S&P 500 intraday chart ──────────────────────────────────────────
export async function fetchSP500Chart(range = '5d', interval = '15m'): Promise<{
    points: ChartPoint[];
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
}> {
    const url = `${YAHOO_BASE}/${encodeURIComponent(SP500_META.symbol)}?range=${range}&interval=${interval}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SP500 chart fetch failed: ${res.status}`);

    const json = await res.json();
    const result = json.chart?.result?.[0];
    if (!result) throw new Error('No S&P 500 chart data');

    const meta = result.meta;
    const timestamps: number[] = result.timestamp || [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];

    const points: ChartPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
        const v = closes[i];
        if (v != null && !isNaN(v)) {
            points.push({ time: timestamps[i], value: v });
        }
    }

    const price = meta.regularMarketPrice ?? points[points.length - 1]?.value ?? 0;
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return { points, price, previousClose, change, changePercent };
}

// ── Single index quote ──────────────────────────────────────────────
async function fetchSingleQuote(meta: IndexMeta): Promise<IndexQuote> {
    const url = `${YAHOO_BASE}/${encodeURIComponent(meta.symbol)}?range=2d&interval=1d`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Quote fetch failed for ${meta.symbol}: ${res.status}`);

    const json = await res.json();
    const result = json.chart?.result?.[0];
    if (!result) throw new Error(`No data for ${meta.symbol}`);

    const m = result.meta;
    const price = m.regularMarketPrice ?? 0;
    const previousClose = m.chartPreviousClose ?? m.previousClose ?? price;
    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
        symbol: meta.symbol,
        name: meta.name,
        displaySymbol: meta.displaySymbol,
        currency: m.currency ?? meta.currency,
        price,
        previousClose,
        change,
        changePercent,
        icon: meta.icon,
        iconColor: meta.iconColor,
        type: meta.type,
        isLive: true,
    };
}

// ── Fetch all major indices quotes ──────────────────────────────────
export async function fetchAllIndices(): Promise<IndexQuote[]> {
    const results = await Promise.allSettled(
        INDEX_LIST.map(meta => fetchSingleQuote(meta))
    );

    return results
        .filter((r): r is PromiseFulfilledResult<IndexQuote> => r.status === 'fulfilled')
        .map(r => r.value);
}
