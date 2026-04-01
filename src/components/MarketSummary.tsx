import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries, IChartApi } from 'lightweight-charts';
import { ChevronRight, Sun, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { TickerSummary } from '../services/priceApi';
import {
    fetchSP500Chart,
    fetchAllIndices,
    type IndexQuote,
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

// ── Dynamic Icon Helper ─────────────────────────────────────────────
const getAssetIcon = (symbol: string, type?: string) => {
    const s = symbol.split('.')[0].toUpperCase();
    if (type === 'crypto' || s === 'BTC' || s === 'ETH' || s === 'SOL' || s === 'BNB' || s === 'ADA' || s === 'DOGE') {
        return `https://cryptologos.cc/logos/${s.toLowerCase()}-${s.toLowerCase()}-logo.png`;
    }
    // Try Clearbit for stocks
    return `https://logo.clearbit.com/${s.toLowerCase()}.com`;
};

import type { Asset } from '../types';

function assetsToMarketItems(assets: Asset[]) {
    return assets
        .map((a) => ({
            id: a.id,
            name: a.name,
            symbol: a.symbol,
            value: a.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            currency: 'USD',
            change: `${a.changePercent >= 0 ? '+' : ''}${a.changePercent.toFixed(2)}%`,
            isNegative: a.changePercent < 0,
            icon: getAssetIcon(a.symbol, a.type),
            isLive: !!a.isLive,
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
    assets: Asset[];
    isLoading?: boolean;
}

export function MarketSummary({ theme, assets, isLoading = false }: MarketSummaryProps) {
    // ── Live Market state (S&P 500 & Global Indices) ──────────────────────────
    const [heroChartData, setHeroChartData] = useState<{ time: any; value: number }[]>([]);
    const [heroPrice, setHeroPrice] = useState(0);
    const [heroChangePercent, setHeroChangePercent] = useState(0);
    const [heroIsLive, setHeroIsLive] = useState(false);
    const [heroMeta] = useState({ symbol: 'SPX', name: 'S&P 500', icon: '500', iconColor: 'bg-[#cb2d3e]' });

    const [indices, setIndices] = useState<IndexQuote[]>([]);
    const [indicesLoading, setIndicesLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        async function loadMarketData() {
            setIndicesLoading(true);
            try {
                // Parallel fetch for Hero (SP500) and Major Indices
                const [spResult, fetchedIndices] = await Promise.all([
                    fetchSP500Chart('5d', '15m'),
                    fetchAllIndices()
                ]);

                if (!isMounted) return;

                // Update Hero data from API
                if (spResult.points.length > 0) {
                    setHeroChartData(spResult.points.map(p => ({ time: p.time as any, value: p.value })));
                    setHeroPrice(spResult.price);
                    setHeroChangePercent(spResult.changePercent);
                    setHeroIsLive(true);
                }

                // Update Major Indices from API
                if (fetchedIndices && fetchedIndices.length > 0) {
                    setIndices(fetchedIndices);
                }
            } catch (e) {
                console.warn('Market live data fetch failed, using fallback values:', e);
                // Fallback values are already in state, but we could explicitly reset to 0 if requirements change.
            } finally {
                if (isMounted) setIndicesLoading(false);
            }
        }

        loadMarketData();
        return () => { isMounted = false; };
    }, [assets]);

    // ── Asset items (from backend / price API) ───────────────────
    const stockAssets = assets.filter(a => a.type === 'stock').slice(0, 6);
    const cryptoAssets = assets.filter(a => a.type === 'crypto').slice(0, 6);

    const stockItems = assetsToMarketItems(stockAssets);
    const cryptoItems = assetsToMarketItems(cryptoAssets);

    const isNegative = heroChangePercent < 0;

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
                                        {heroIsLive ? (
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
                                                <span className="text-[26px] font-bold tracking-tight leading-none">{formatPrice(heroPrice)}</span>
                                                <span className="text-xs font-semibold opacity-60 mb-[2px]">USD</span>
                                                <span className={cn("text-sm font-semibold mb-[2px] ml-2", isNegative ? "text-[#ef4444]" : "text-[#10b981]")}>
                                                    {heroChangePercent >= 0 ? '+' : ''}{heroChangePercent.toFixed(2)}%
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative -mx-4 -mb-2 mt-4 px-4 overflow-hidden">
                            <div className="absolute inset-0">
                                {heroChartData.length > 0 ? (
                                    <AreaChart data={heroChartData} theme={theme} isNegative={isNegative} />
                                ) : (
                                    <div className="flex items-center justify-center h-full opacity-20">
                                        <Loader2 size={32} className="animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Card: Other Group Assets or Indices */}
                    <div className="glass-panel p-6 flex flex-col min-h-[460px]">
                        <h3 className="font-bold text-base mb-5">
                            {indices.length > 0 ? "Major indices" : "Asset Insights"}
                        </h3>
                        {indicesLoading && indices.length === 0 ? (
                            <div className="flex-1 flex flex-col space-y-4">
                                {assets.slice(0, 6).map((asset, i) => (
                                    <div key={asset.id} className="flex items-center justify-between py-2 border-b border-[var(--border)]/10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[var(--foreground)]/5 flex items-center justify-center text-[10px] font-bold">
                                                {asset.symbol.substring(0, 2)}
                                            </div>
                                            <span className="text-xs font-medium">{asset.name}</span>
                                        </div>
                                        <span className="text-xs font-mono">{formatPrice(asset.price)}</span>
                                    </div>
                                ))}
                                <div className="text-[10px] opacity-30 italic mt-auto">Indices not configured in database</div>
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
                                See all database assets <ChevronRight size={14} className="ml-0.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Market Sections Based on Backend Data Types */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {stockItems.length > 0 && (
                    <MarketList
                        title="Database Stocks"
                        items={stockItems}
                        footerLabel="Analysis for all stocks"
                        isLoading={isLoading && stockItems.length === 0}
                    />
                )}
                {cryptoItems.length > 0 && (
                    <MarketList
                        title="Database Crypto"
                        items={cryptoItems}
                        footerLabel="Analysis for all crypto"
                        isLoading={isLoading && cryptoItems.length === 0}
                    />
                )}
            </div>
        </div>
    );
}
