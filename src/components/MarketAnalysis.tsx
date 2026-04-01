import React from 'react';
import { CandlestickChart } from './CandlestickChart';
import { NewsTimeline } from './NewsTimeline';
import { Asset, NewsItem } from '../types';

interface MarketAnalysisProps {
    theme: 'light' | 'dark';
    selectedAsset: Asset;
    newsData: NewsItem[];
    mockChartData: any[];
}

export function MarketAnalysis({ theme, selectedAsset, newsData, mockChartData }: MarketAnalysisProps) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-mono uppercase opacity-40 tracking-widest">Market Analysis</h2>
                    <div className="flex gap-2">
                        {['1D', '1W', '1M', '1Y', 'ALL'].map(t => (
                            <button key={t} className="text-[10px] px-2 py-1 glass-button">{t}</button>
                        ))}
                    </div>
                </div>
                <div className="glass-panel flex-1 min-h-[400px] p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-bold">{selectedAsset.symbol}</span>
                            <span className="text-sm opacity-40">{selectedAsset.name}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-mono">182.63</p>
                            <p className="text-xs text-green-400 font-mono">+1.25 (0.68%)</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 relative w-full">
                        <div className="absolute inset-0">
                            <CandlestickChart data={mockChartData} containerId="main-chart" theme={theme} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col space-y-4">
                <h2 className="text-xs font-mono uppercase opacity-40 tracking-widest">Recent Activity</h2>
                <div className="glass-panel flex-1 min-h-[400px] flex flex-col">
                    <div className="flex-1 min-h-0 relative w-full">
                        <div className="absolute inset-0 overflow-hidden">
                            <NewsTimeline news={newsData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
