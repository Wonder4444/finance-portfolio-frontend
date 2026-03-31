import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, AreaSeries, IChartApi } from 'lightweight-charts';
import { ChevronRight, Sun, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { TickerSummary } from '../services/priceApi';

// Generate mock data mimicking the S&P 500 chart shown in the image
const MOCK_AREA_CHART_DATA = Array.from({ length: 400 }, (_, i) => {
    const date = new Date('2026-03-30T22:00:00Z');
    date.setMinutes(date.getMinutes() + (i * 2)); // 2 mins per point

    // Create a realistic looking downward trend based on the image
    let value = 6400;
    if (i < 50) value -= i * 0.5 + Math.random() * 5;
    else if (i < 100) value += (i - 50) * 0.3 + Math.random() * 10;
    else if (i < 200) value -= (i - 100) * 0.8 + Math.random() * 8;
    else if (i < 300) value -= (i - 200) * 0.4 + Math.random() * 4;
    else value -= (i - 300) * 0.6 + Math.random() * 6;

    // Make it match the 6368.86 ending value roughly
    return {
        time: Math.floor(date.getTime() / 1000) as any,
        value: value - 50,
    };
});

function AreaChart({ data, theme }: { data: any[], theme: 'light' | 'dark' }) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

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
            rightPriceScale: {
                visible: false,
            },
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
                horzLine: {
                    visible: false,
                    labelVisible: false,
                },
            },
            handleScroll: false,
            handleScale: false,
        });

        const series = chartRef.current.addSeries(AreaSeries, {
            lineColor: '#ef4444',
            topColor: 'rgba(239, 68, 68, 0.25)',
            bottomColor: 'rgba(239, 68, 68, 0.0)',
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
                    height: chartContainerRef.current.clientHeight
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) chartRef.current.remove();
        };
    }, [data, theme]);

    return <div ref={chartContainerRef} className="w-full h-[320px]" />;
}

const INDICES = [
    { id: '1', name: 'Nasdaq 100', symbol: 'NDX', type: 'D', value: '23,132.77', currency: 'USD', change: '-1.93%', isNegative: true, icon: '100', iconColor: 'bg-[#00a8e8]' },
    { id: '2', name: 'Japan 225', symbol: 'NI225', type: '', value: '51,885.80', currency: 'JPY', change: '-2.79%', isNegative: true, icon: '225', iconColor: 'bg-[#1e3a8a]' },
    { id: '3', name: 'SSE Composite', symbol: '000001', type: 'D', value: '3,923.2869', currency: 'CNY', change: '+0.24%', isNegative: false, icon: 'SSE', iconColor: 'bg-[#1e3a8a]' },
    { id: '4', name: 'FTSE 100', symbol: 'UKX', type: 'D', value: '10,020.75', currency: 'GBP', change: '+0.54%', isNegative: false, icon: 'GB', iconColor: '' },
    { id: '5', name: 'DAX', symbol: 'DAX', type: 'D', value: '22,290.08', currency: 'EUR', change: '-0.05%', isNegative: true, icon: 'X', iconColor: 'bg-[#2563eb]' },
    { id: '6', name: 'CAC 40', symbol: 'PX1', type: 'D', value: '7,713.88', currency: 'EUR', change: '+0.15%', isNegative: false, icon: '40', iconColor: 'bg-[#059669]' },
];

const HIGHEST_VOLUME_CRYPTO = [
    { id: 'c1', name: 'Bitcoin', symbol: 'BTC', value: '64,231.50', currency: 'USD', change: '-1.82%', isNegative: true, icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
    { id: 'c2', name: 'Ethereum', symbol: 'ETH', value: '3,452.10', currency: 'USD', change: '+1.34%', isNegative: false, icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
    { id: 'c3', name: 'Solana', symbol: 'SOL', value: '145.28', currency: 'USD', change: '+4.52%', isNegative: false, icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
    { id: 'c4', name: 'Binance Coin', symbol: 'BNB', value: '582.40', currency: 'USD', change: '-0.51%', isNegative: true, icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
    { id: 'c5', name: 'Cardano', symbol: 'ADA', value: '0.45', currency: 'USD', change: '-2.13%', isNegative: true, icon: 'https://cryptologos.cc/logos/cardano-ada-logo.png' },
    { id: 'c6', name: 'Dogecoin', symbol: 'DOGE', value: '0.16', currency: 'USD', change: '+12.45%', isNegative: false, icon: 'https://cryptologos.cc/logos/dogecoin-doge-logo.png' },
];

// Fallback static stock data (used when API data is not available)
const FALLBACK_STOCKS = [
    { id: 's1', name: 'NVIDIA Corporation', symbol: 'NVDA', value: '167.52', currency: 'USD', change: '-2.17%', isNegative: true, icon: 'https://logo.clearbit.com/nvidia.com' },
    { id: 's4', name: 'Tesla, Inc.', symbol: 'TSLA', value: '361.83', currency: 'USD', change: '-2.76%', isNegative: true, icon: 'https://logo.clearbit.com/tesla.com' },
    { id: 's5', name: 'Micron Technology', symbol: 'MU', value: '357.22', currency: 'USD', change: '+0.50%', isNegative: false, icon: 'https://logo.clearbit.com/micron.com' },
    { id: 's3', name: 'Meta Platforms, Inc.', symbol: 'META', value: '525.72', currency: 'USD', change: '-3.99%', isNegative: true, icon: 'https://logo.clearbit.com/meta.com' },
    { id: 's2', name: 'Microsoft Corporation', symbol: 'MSFT', value: '356.77', currency: 'USD', change: '-2.51%', isNegative: true, icon: 'https://logo.clearbit.com/microsoft.com' },
    { id: 's6', name: 'Apple Inc.', symbol: 'AAPL', value: '248.80', currency: 'USD', change: '-1.62%', isNegative: true, icon: 'https://logo.clearbit.com/apple.com' },
];

// Icon map for tickers from the API
const TICKER_ICONS: Record<string, string> = {
    AAPL: 'https://logo.clearbit.com/apple.com',
    TSLA: 'https://logo.clearbit.com/tesla.com',
    AMZN: 'https://logo.clearbit.com/amazon.com',
    C: 'https://logo.clearbit.com/citigroup.com',
    FB: 'https://logo.clearbit.com/meta.com',
};

/**
 * Convert TickerSummary[] to the format used by MarketGridItem
 */
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

function MarketGridItem({ item }: { item: any }) {
    return (
        <div className="flex items-center justify-between py-[11px] hover:bg-[var(--foreground)]/5 rounded-lg -mx-3 px-3 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-[var(--border)] flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                    <img
                        src={item.icon}
                        alt={item.name}
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${item.symbol}&background=random`;
                        }}
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

function MarketList({ title, items, footerLabel, isLoading }: { title: string, items: any[], footerLabel: string, isLoading?: boolean }) {
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
                        {/* First column */}
                        <div className="flex flex-col">
                            {items.slice(0, 3).map((item, i) => (
                                <React.Fragment key={item.id}>
                                    <MarketGridItem item={item} />
                                    {i < 2 && (
                                        <div className="h-px w-full bg-[var(--border)]/50 ml-10"></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                        {/* Second column */}
                        <div className="flex flex-col">
                            {items.slice(3, 6).map((item, i) => (
                                <React.Fragment key={item.id}>
                                    <MarketGridItem item={item} />
                                    {i < 2 && (
                                        <div className="h-px w-full bg-[var(--border)]/50 ml-10"></div>
                                    )}
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

interface MarketSummaryProps {
    theme: 'light' | 'dark';
    tickerSummaries?: TickerSummary[];
    isLoading?: boolean;
}

export function MarketSummary({ theme, tickerSummaries = [], isLoading = false }: MarketSummaryProps) {
    // Convert live ticker summaries to market items, or use fallback
    const liveStockItems = tickerSummaries.length > 0
        ? summariesToMarketItems(tickerSummaries)
        : FALLBACK_STOCKS;

    // Pad to 6 items if fewer than 6 live items: fill remaining slots with fallback
    const stockItems = liveStockItems.length >= 6
        ? liveStockItems.slice(0, 6)
        : [
            ...liveStockItems,
            ...FALLBACK_STOCKS.filter(fb => !liveStockItems.find(li => li.symbol === fb.symbol)).slice(0, 6 - liveStockItems.length),
        ];

    return (
        <div className="flex flex-col space-y-8 font-sans">
            <div className="flex flex-col space-y-4">
                <h2 className="text-xs font-mono uppercase opacity-40 tracking-widest">Market summary</h2>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Card: Main Chart */}
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
                                        <span className="w-5 h-4 bg-[var(--foreground)]/5 rounded border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--foreground)]/50 leading-none ml-1">−</span>
                                    </div>
                                    <div className="flex items-end gap-2 mt-1">
                                        <span className="text-[26px] font-bold tracking-tight leading-none">6,368.86</span>
                                        <span className="text-xs font-semibold opacity-60 mb-[2px]">USD</span>
                                        <span className="text-sm font-semibold text-[#ef4444] mb-[2px] ml-2">-1.67%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative -mx-4 -mb-2 mt-4 px-4 overflow-hidden">
                            <div className="absolute inset-0">
                                <AreaChart data={MOCK_AREA_CHART_DATA} theme={theme} />
                            </div>
                        </div>
                    </div>

                    {/* Right Card: Major Indices */}
                    <div className="glass-panel p-6 flex flex-col min-h-[460px]">
                        <h3 className="font-bold text-base mb-5">Major indices</h3>
                        <div className="flex-1 flex flex-col gap-0.5">
                            {INDICES.map((index, i) => (
                                <React.Fragment key={index.id}>
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
                                                    <span className="w-4 h-[14px] bg-[var(--foreground)]/5 rounded border border-[var(--border)] flex items-center justify-center text-[8px] text-[var(--foreground)]/50 leading-none">−</span>
                                                </div>
                                                <span className="text-[9px] px-1 py-0.5 bg-[var(--foreground)]/5 border border-[var(--border)] rounded font-semibold text-[var(--foreground)]/60 w-max leading-none">
                                                    {index.symbol}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-[13px] font-semibold leading-none">{index.value}</span>
                                                <span className="text-[9px] font-semibold text-[var(--foreground)]/50 leading-none">{index.currency}</span>
                                            </div>
                                            <span className={cn("text-[11px] font-medium leading-none", index.isNegative ? "text-[#ef4444]" : "text-[#10b981]")}>
                                                {index.change}
                                            </span>
                                        </div>
                                    </div>
                                    {i < INDICES.length - 1 && (
                                        <div className="h-px w-full bg-[var(--border)]/50 ml-10"></div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                            <button className="text-[13px] text-blue-600 dark:text-blue-400 font-medium hover:underline transition-all flex items-center">
                                See all major indices <ChevronRight size={14} className="ml-0.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Sections: Highest Volume Stocks (LIVE) and Crypto */}
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
