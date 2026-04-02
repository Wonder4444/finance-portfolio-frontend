import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface MarketHeatmapProps {
    assets?: any[]; // Keep for compatibility but unused
    theme?: 'light' | 'dark';
}

export function MarketHeatmap({ theme = 'dark' }: MarketHeatmapProps) {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous widget if any for re-renders or hot reloads
        containerRef.current.innerHTML = '';
        
        // Create the container for the script to avoid being wiped out if the parent re-renders in a way that doesn't trigger useEffect
        const widgetWrapper = document.createElement('div');
        widgetWrapper.className = 'tradingview-widget-container__widget';
        widgetWrapper.style.width = '100%';
        widgetWrapper.style.height = '100%';
        
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
        script.type = 'text/javascript';
        script.async = true;
        // Construct the config carefully
        const config = {
            "exchanges": [],
            "dataSource": "S&P500",
            "grouping": "sector",
            "blockSize": "market_cap_basic",
            "blockColor": "change",
            "locale": "en",
            "symbolUrl": "",
            "colorTheme": theme,
            "hasTopBar": false,
            "isDatasetControlEnabled": false,
            "isZoomEnabled": true,
            "hasSymbolTooltip": true,
            "width": "100%",
            "height": "100%"
        };
        script.innerHTML = JSON.stringify(config);
        
        containerRef.current.appendChild(widgetWrapper);
        containerRef.current.appendChild(script);

        // Cleanup function for when component unmounts
        return () => {
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [theme]);

    return (
        <div className="flex flex-col h-full space-y-4 w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xs font-mono uppercase opacity-40 tracking-widest">{t('marketHeatmap', 'Market Heatmap')}</h2>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-mono font-bold tracking-widest uppercase">TradingView Live</span>
                    </div>
                </div>
            </div>
            <div className="glass-panel h-[500px] md:h-[600px] lg:h-[70vh] xl:h-[750px] max-h-[1000px] flex flex-col w-full bg-[var(--background)] border border-[var(--border)] overflow-hidden shadow-2xl relative">
                <div className="tradingview-widget-container flex-1 w-full" ref={containerRef}>
                    {/* The widget will be injected here */}
                </div>
                
                {/* Fallback/Loading message */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none -z-10">
                    <p className="text-xl font-mono">Loading TradingView Heatmap...</p>
                </div>
            </div>
        </div>
    );
}
