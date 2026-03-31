import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries, IChartApi } from 'lightweight-charts';
import { ChevronRight, Sun, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { TickerSummary } from '../services/priceApi';
import {
    fetchSP500Chart,
    fetchAllIndices,
    type IndexQuote,
    type ChartPoint,
} from '../services/indicesApi';

// ── Area chart component ─────────────────────────────────────────────
function AreaChart({ data, theme, isNegative }: { data: { time: any; value: number }[]; theme: 'light' | 'dark'; isNegative?: boolean }) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        chartRef.current = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: theme === 'dark' ? '#9ca3af' : '#1f2937',
                fontFamily: 'Inter, sans-serif',
            },
            grid: {
                vertLines: { visible: false },
                horzLines: { visible: false },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            rightPriceScale: { visible: false },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
                tickMarkFormatter: (time: any) => {
                    const date = new Date(time * 1000);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                },
            },
            crosshair: {
                vertLine: {
                    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                    labelBackgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                },
                horzLine: { visible: false, labelVisible: false },
            },
            handleScroll: false,
            handleScale: false,
        });

        const lineColor = isNegative ? '#ef4444' : '#10b981';
        const series = chartRef.current.addSeries(AreaSeries, {
            lineColor,
            topColor: isNegative ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
            bottomColor: isNegative ? 'rgba(239, 68, 68, 0.0)' : 'rgba(16, 185, 129, 0.0)',
            lineWidth: 2,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
        });

        series.setData(data);
        chartRef.current.timeScale().fitContent();

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) chartRef.current.remove();
        };
    }, [data, theme, isNegative]);

    return <div ref={chartContainerRef} className="w-full h-[320px]" />;
}

// ── Fallback static data ─────────────────────────────────────────────
const FALLBACK_INDICES = [
    { symbol: '^NDX', name: 'Nasdaq 100', displaySymbol: 'NDX', currency: 'USD', price: 23132.77, previousClose: 23587, change: -454.23, changePercent: -1.93, icon: '100', iconColor: 'bg-[#00a8e8]', type: 'D', isLive: false },
    { symbol: '^N225', name: 'Japan 225', displaySymbol: 'NI225', currency: 'JPY', price: 51885.80, previousClose: 53375, change: -1489.2, changePercent: -2.79, icon: '225', iconColor: 'bg-[#1e3a8a]', type: '', isLive: false },
    { symbol: '000001.SS', name: 'SSE Composite', displaySymbol: '000001', currency: 'CNY', price: 3923.2869, previousClose: 3914, change: 9.29, changePercent: 0.24, icon: 'SSE', iconColor: 'bg-[#1e3a8a]', type: 'D', isLive: false },
    { symbol: '^FTSE', name: 'FTSE 100', displaySymbol: 'UKX', currency: 'GBP', price: 10020.75, previousClose: 9966, change: 54.75, changePercent: 0.54, icon: 'GB', iconColor: '', type: 'D', isLive: false },
    { symbol: '^GDAXI', name: 'DAX', displaySymbol: 'DAX', currency: 'EUR', price: 22290.08, previousClose: 22301, change: -10.92, changePercent: -0.05, icon: 'X', iconColor: 'bg-[#2563eb]', type: 'D', isLive: false },
    { symbol: '^FCHI', name: 'CAC 40', displaySymbol: 'PX1', currency: 'EUR', price: 7713.88, previousClose: 7702, change: 11.88, changePercent: 0.15, icon: '40', iconColor: 'bg-[#059669]', type: 'D', isLive: false },
];

// Fallback S&P 500 chart data (generated)
const FALLBACK_SP500_CHART = Array.from({ length: 400 }, (_, i) => {
    const date = new Date('2026-03-30T14:00:00Z');
    date.setMinutes(date.getMinutes() + (i * 2));
    let value = 6400;
    if (i < 50) value -= i * 0.5 + Math.random() * 5;
    else if (i < 100) value += (i - 50) * 0.3 + Math.random() * 10;
    else if (i < 200) value -= (i - 100) * 0.8 + Math.random() * 8;
    else if (i < 300) value -= (i - 200) * 0.4 + Math.random() * 4;
    else value -= (i - 300) * 0.6 + Math.random() * 6;
    return { time: Math.floor(date.getTime() / 1000) as any, value: value - 50 };
});

const HIGHEST_VOLUME_CRYPTO = [
    { id: 'c1', name: 'Bitcoin', symbol: 'BTC', value: '64,231.50', currency: 'USD', change: '-1.82%', isNegative: true, icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
    { id: 'c2', name: 'Ethereum', symbol: 'ETH', value: '3,452.10', currency: 'USD', change: '+1.34%', isNegative: false, icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { id: 'c3', name: 'Solana', symbol: 'SOL', value: '145.28', currency: 'USD', change: '+4.52%', isNegative: false, icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
    { id: 'c4', name: 'Binance Coin', symbol: 'BNB', value: '582.40', currency: 'USD', change: '-0.51%', isNegative: true, icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
    { id: 'c5', name: 'Cardano', symbol: 'ADA', value: '0.45', currency: 'USD', change: '-2.13%', isNegative: true, icon: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
    { id: 'c6', name: 'Dogecoin', symbol: 'DOGE', value: '0.16', currency: 'USD', change: '+12.45%', isNegative: false, icon: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
];

const FALLBACK_STOCKS = [
    { id: 's1', name: 'NVIDIA Corporation', symbol: 'NVDA', value: '167.52', currency: 'USD', change: '-2.17%', isNegative: true, icon: 'https://logo.clearbit.com/nvidia.com' },
    { id: 's4', name: 'Tesla, Inc.', symbol: 'TSLA', value: '361.83', currency: 'USD', change: '-2.76%', isNegative: true, icon: 'https://logo.clearbit.com/tesla.com' },
    { id: 's5', name: 'Micron Technology', symbol: 'MU', value: '357.22', currency: 'USD', change: '+0.50%', isNegative: false, icon: 'https://logo.clearbit.com/micron.com' },
    { id: 's3', name: 'Meta Platforms, Inc.', symbol: 'META', value: '525.72', currency: 'USD', change: '-3.99%', isNegative: true, icon: 'https://logo.clearbit.com/meta.com' },
    { id: 's2', name: 'Microsoft Corporation', symbol: 'MSFT', value: '356.77', currency: 'USD', change: '-2.51%', isNegative: true, icon: 'https://logo.clearbit.com/microsoft.com' },
    { id: 's6', name: 'Apple Inc.', symbol: 'AAPL', value: '248.80', currency: 'USD', change: '-1.62%', isNegative: true, icon: 'https://logo.clearbit.com/apple.com' },
];

const TICKER_ICONS: Record<string, string> = {
    AAPL: 'https://logo.clearbit.com/apple.com',
    TSLA: 'https://logo.clearbit.com/tesla.com',
    AMZN: 'https://logo.clearbit.com/amazon.com',
    C: 'https://logo.clearbit.com/citigroup.com',
    FB: 'https://logo.clearbit.com/meta.com',
};

function summariesToMarketItems(summaries: TickerSummary[]) {
    return summaries
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .map((s, i) => ({
            id: `live-${s.ticker}-${i}`,
            name: s.name,
            symbol: s.ticker,
            value: s.latestPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            currency: 'USD',
            change: `${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%`,
            isNegative: s.changePercent < 0,
            icon: TICKER_ICONS[s.ticker] || `https://ui-avatars.com/api/?name=${s.ticker}&background=random`,
            isLive: true,
        }));
}

// ── Helper: format price with thousands separators ───────────────────
function formatPrice(value: number, decimals = 2): string {
    return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ── Market grid item (stocks list) ──────────────────────────────────
function MarketGridItem({ item }: { item: any }) {
    return (
        <div className="flex items-center justify-between py-[11px] hover:bg-[var(--foreground)]/5 rounded-lg -mx-3 px-3 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-[var(--border)] flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                    <img
                        src={item.icon}
                        alt={item.name}
                        className="w-5 h-5 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${item.symbol}&background=random`; }}
                    />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[13px] font-medium leading-none truncate">{item.name}</span>
                        {item.isLive ? (
                            <span className="text-[7px] px-1 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-mono leading-none shrink-0">LIVE</span>
                        ) : (
                            <Sun size={10} className="text-orange-400 fill-orange-400 opacity-60 shrink-0" />
                        )}
                    </div>
                    <span className="text-[9px] px-1 py-0.5 bg-[var(--foreground)]/5 border border-[var(--border)] rounded font-semibold text-[var(--foreground)]/60 w-max leading-none">
                        {item.symbol}
                    </span>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                <div className="flex items-baseline gap-1">
                    <span className="text-[13px] font-semibold leading-none whitespace-nowrap">{item.value}</span>
                    <span className="text-[9px] font-semibold text-[var(--foreground)]/50 leading-none uppercase">{item.currency}</span>
                </div>
                <span className={cn("text-[11px] font-medium leading-none whitespace-nowrap", item.isNegative ? "text-[#ef4444]" : "text-[#10b981]")}>
                    {item.change}
                </span>
            </div>
        </div>
    );
}

// ── Market list section (stocks / crypto) ────────────────────────────
function MarketList({ title, items, footerLabel, isLoading }: { title: string; items: any[]; footerLabel: string; isLoading?: boolean }) {
    return (
        <div className="flex flex-col h-full space-y-4">
            <h2 className="text-xs font-mono uppercase opacity-40 tracking-widest">{title}</h2>
            <div className="glass-panel p-6 flex flex-col overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8 gap-2 opacity-40">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Loading live data...</span>
                    </div>
                ) : (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <div className="flex flex-col">
                            {items.slice(0, 3).map((item, i) => (
                                <React.Fragment key={item.id}>
                                    <MarketGridItem item={item} />
                                    {i < 2 && <div className="h-px w-full bg-[var(--border)]/50 ml-10" />}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="flex flex-col">
                            {items.slice(3, 6).map((item, i) => (
                                <React.Fragment key={item.id}>
                                    <MarketGridItem item={item} />
                                    {i < 2 && <div className="h-px w-full bg-[var(--border)]/50 ml-10" />}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                    <button className="text-[13px] text-blue-600 dark:text-blue-400 font-medium hover:underline transition-all flex items-center">
                        {footerLabel} <ChevronRight size={14} className="ml-0.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Index row item (right panel) ─────────────────────────────────────
function IndexRow({ index }: { index: IndexQuote }) {
    const isNegative = index.changePercent < 0;
    const changeStr = `${isNegative ? '' : '+'}${index.changePercent.toFixed(2)}%`;

    return (
        <div className="flex items-center justify-between py-[11px] hover:bg-[var(--foreground)]/5 rounded-lg -mx-3 px-3 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
                <div className={cn("w-[28px] h-[28px] rounded-full flex items-center justify-center text-white text-[9px] font-bold shadow-sm shrink-0", index.iconColor, index.icon === 'GB' ? "p-0 overflow-hidden bg-transparent" : "")}>
                    {index.icon === 'GB' ? (
                        <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="64" height="64" rx="32" fill="#012169" />
                            <path d="M64 0L0 64" stroke="white" strokeWidth="6" />
                            <path d="M0 0L64 64" stroke="white" strokeWidth="6" />
                            <path d="M64 0L0 64" stroke="#C8102E" strokeWidth="4" />
                            <path d="M0 0L64 64" stroke="#C8102E" strokeWidth="4" />
                            <rect x="25" width="14" height="64" fill="white" />
                            <rect y="25" width="64" height="14" fill="white" />
                            <rect x="28" width="8" height="64" fill="#C8102E" />
                            <rect y="28" width="64" height="8" fill="#C8102E" />
                        </svg>
                    ) : index.icon === 'SSE' ? (
                        <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="bg-[#1e3a8a] rounded-full">
                            <path d="M12 30C25 30 25 20 32 20C39 20 39 30 52 30M12 40C25 40 25 30 32 30C39 30 39 40 52 40" stroke="white" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                    ) : index.icon}
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium leading-none">{index.name}</span>
                        {index.type && <span className="text-[8px] text-[#f59e0b] font-bold leading-none">{index.type}</span>}
                        {index.isLive ? (
                            <span className="text-[7px] px-1 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-mono leading-none">LIVE</span>
                        ) : (
                            <span className="w-4 h-[14px] bg-[var(--foreground)]/5 rounded border border-[var(--border)] flex items-center justify-center text-[8px] text-[var(--foreground)]/50 leading-none">−</span>
                        )}
                    </div>
                    <span className="text-[9px] px-1 py-0.5 bg-[var(--foreground)]/5 border border-[var(--border)] rounded font-semibold text-[var(--foreground)]/60 w-max leading-none">
                        {index.displaySymbol}
                    </span>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <div className="flex items-baseline gap-1">
                    <span className="text-[13px] font-semibold leading-none">{formatPrice(index.price)}</span>
                    <span className="text-[9px] font-semibold text-[var(--foreground)]/50 leading-none">{index.currency}</span>
                </div>
                <span className={cn("text-[11px] font-medium leading-none", isNegative ? "text-[#ef4444]" : "text-[#10b981]")}>
                    {changeStr}
                </span>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════
// MarketSummary component
// ══════════════════════════════════════════════════════════════════════
interface MarketSummaryProps {
    theme: 'light' | 'dark';
    tickerSummaries?: TickerSummary[];
    isLoading?: boolean;
}

export function MarketSummary({ theme, tickerSummaries = [], isLoading = false }: MarketSummaryProps) {
    // ── Live index state ─────────────────────────────────────────────
    const [spChartData, setSpChartData] = useState<{ time: any; value: number }[]>(FALLBACK_SP500_CHART);
    const [spPrice, setSpPrice] = useState(6368.86);
    const [spChangePercent, setSpChangePercent] = useState(-1.67);
    const [spIsLive, setSpIsLive] = useState(false);
    const [indices, setIndices] = useState<IndexQuote[]>(FALLBACK_INDICES);
    const [indicesLoading, setIndicesLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadIndices() {
            setIndicesLoading(true);

            // Fetch S&P 500 chart + all major indices in parallel
            const [spResult, idxResult] = await Promise.allSettled([
                fetchSP500Chart('5d', '15m'),
                fetchAllIndices(),
            ]);

            if (cancelled) return;

            // S&P 500 chart
            if (spResult.status === 'fulfilled') {
                const sp = spResult.value;
                if (sp.points.length > 0) {
                    setSpChartData(sp.points.map(p => ({ time: p.time as any, value: p.value })));
                    setSpPrice(sp.price);
                    setSpChangePercent(sp.changePercent);
                    setSpIsLive(true);
                }
            } else {
                console.warn('S&P 500 chart fetch failed, using fallback:', spResult.reason);
            }

            // Major indices
            if (idxResult.status === 'fulfilled' && idxResult.value.length > 0) {
                setIndices(idxResult.value);
            } else {
                console.warn('Indices fetch failed, using fallback:', idxResult.status === 'rejected' ? idxResult.reason : 'No data');
            }

            setIndicesLoading(false);
        }

        loadIndices();
        return () => { cancelled = true; };
    }, []);

    // ── Stock items (from Portfolio Manager API) ─────────────────────
    const liveStockItems = tickerSummaries.length > 0
        ? summariesToMarketItems(tickerSummaries)
        : FALLBACK_STOCKS;
    const stockItems = liveStockItems.length >= 6
        ? liveStockItems.slice(0, 6)
        : [...liveStockItems, ...FALLBACK_STOCKS.filter(fb => !liveStockItems.find(li => li.symbol === fb.symbol)).slice(0, 6 - liveStockItems.length)];

    const spIsNegative = spChangePercent < 0;

    return (
        <div className="flex flex-col space-y-8 font-sans">
            <div className="flex flex-col space-y-4">
                <h2 className="text-xs font-mono uppercase opacity-40 tracking-widest">Market summary</h2>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Card: S&P 500 Chart (LIVE) */}
                    <div className="xl:col-span-2 glass-panel p-6 flex flex-col min-h-[460px] relative overflow-hidden">
                        <div className="flex flex-col mb-4 relative z-10 pl-2">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-[#cb2d3e] text-white flex items-center justify-center font-bold text-xl shadow-inner">
                                    500
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg leading-none">S&P 500</h3>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--foreground)]/5 border border-[var(--border)] rounded font-semibold text-[var(--foreground)]/70 leading-none">SPX</span>
                                        {spIsLive ? (
                                            <span className="text-[7px] px-1 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-mono leading-none ml-1">LIVE</span>
                                        ) : (
                                            <span className="w-5 h-4 bg-[var(--foreground)]/5 rounded border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--foreground)]/50 leading-none ml-1">−</span>
                                        )}
                                    </div>
                                    <div className="flex items-end gap-2 mt-1">
                                        {indicesLoading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 size={18} className="animate-spin text-blue-400" />
                                                <span className="text-sm opacity-40">Loading...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-[26px] font-bold tracking-tight leading-none">{formatPrice(spPrice)}</span>
                                                <span className="text-xs font-semibold opacity-60 mb-[2px]">USD</span>
                                                <span className={cn("text-sm font-semibold mb-[2px] ml-2", spIsNegative ? "text-[#ef4444]" : "text-[#10b981]")}>
                                                    {spIsNegative ? '' : '+'}{spChangePercent.toFixed(2)}%
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative -mx-4 -mb-2 mt-4 px-4 overflow-hidden">
                            <div className="absolute inset-0">
                                <AreaChart data={spChartData} theme={theme} isNegative={spIsNegative} />
                            </div>
                        </div>
                    </div>

                    {/* Right Card: Major Indices (LIVE) */}
                    <div className="glass-panel p-6 flex flex-col min-h-[460px]">
                        <h3 className="font-bold text-base mb-5">Major indices</h3>
                        {indicesLoading ? (
                            <div className="flex-1 flex items-center justify-center gap-2 opacity-40">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-sm">Loading indices...</span>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col gap-0.5">
                                {indices.map((index, i) => (
                                    <React.Fragment key={index.symbol}>
                                        <IndexRow index={index} />
                                        {i < indices.length - 1 && (
                                            <div className="h-px w-full bg-[var(--border)]/50 ml-10" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                            <button className="text-[13px] text-blue-600 dark:text-blue-400 font-medium hover:underline transition-all flex items-center">
                                See all major indices <ChevronRight size={14} className="ml-0.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Highest Volume Stocks (from Portfolio Manager API) & Crypto */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <MarketList
                    title="Highest volume stocks"
                    items={stockItems}
                    footerLabel="See all most actively traded stocks"
                    isLoading={isLoading && tickerSummaries.length === 0}
                />
                <MarketList
                    title="Highest volume crypto"
                    items={HIGHEST_VOLUME_CRYPTO}
                    footerLabel="See all most actively traded crypto"
                />
            </div>
        </div>
    );
}
